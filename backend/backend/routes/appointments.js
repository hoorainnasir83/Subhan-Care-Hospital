const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

const ALL_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/appointments/available-slots
// @access  Private
router.get('/available-slots', protect, async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, error: 'Doctor ID and Date are required' });
    }

    let bookedSlots = [];

    if (mongoose.connection.readyState === 1) {
      const scheduledApts = await Appointment.find({ doctorId, date, status: 'Scheduled' });
      bookedSlots = scheduledApts.map(a => a.time);
    } else {
      const store = global.memoryStore;
      const scheduledApts = store.appointments.filter(
        a => a.doctorId === doctorId && a.date === date && a.status === 'Scheduled'
      );
      bookedSlots = scheduledApts.map(a => a.time);
    }

    const availableSlots = ALL_SLOTS.filter(slot => !bookedSlots.includes(slot));

    return res.json({
      success: true,
      doctorId,
      date,
      allSlots: ALL_SLOTS,
      bookedSlots,
      availableSlots
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get all appointments (scoped by role)
// @route   GET /api/appointments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Doctor' && req.user.doctorId) {
      query.doctorId = req.user.doctorId;
    }

    if (mongoose.connection.readyState === 1) {
      const appointments = await Appointment.find(query).sort({ date: -1, time: -1 });
      return res.json({ success: true, count: appointments.length, data: appointments });
    }

    let appointments = global.memoryStore.appointments;
    if (req.user.role === 'Doctor' && req.user.doctorId) {
      appointments = appointments.filter(a => a.doctorId === req.user.doctorId);
    }
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Staff)
router.post('/', protect, authorize('Admin', 'Receptionist', 'Staff'), async (req, res) => {
  try {
    const { patientId, doctorId, date, time } = req.body;

    if (mongoose.connection.readyState === 1) {
      const doctor = await Doctor.findOne({ id: doctorId });
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found in roster' });

      const patient = await Patient.findOne({ id: patientId });
      if (!patient) return res.status(404).json({ success: false, error: 'Patient not found in registry' });

      const overlap = await Appointment.findOne({ doctorId, date, time, status: 'Scheduled' });
      if (overlap) {
        return res.status(400).json({ success: false, error: `TC-02: ${doctor.name} already has a scheduled appointment on ${date} at ${time}. Please choose a different time slot.` });
      }

      const aptId = `apt-${Date.now()}`;
      const appointment = await Appointment.create({ id: aptId, patientId, patientName: patient.name, doctorId, doctorName: doctor.name, date, time, fee: doctor.fee || 100, status: 'Scheduled' });
      doctor.consultsCount += 1;
      await doctor.save();
      return res.status(201).json({ success: true, data: appointment });
    } else {
      const store = global.memoryStore;
      const doctor = store.doctors.find(d => d.id === doctorId);
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found in roster' });

      const patient = store.patients.find(p => p.id === patientId);
      if (!patient) return res.status(404).json({ success: false, error: 'Patient not found in registry' });

      const overlap = store.appointments.find(a => a.doctorId === doctorId && a.date === date && a.time === time && a.status === 'Scheduled');
      if (overlap) {
        return res.status(400).json({ success: false, error: `TC-02: ${doctor.name} already has a scheduled appointment on ${date} at ${time}. Please choose a different time slot.` });
      }

      const aptId = `apt-${Date.now()}`;
      const newApt = { id: aptId, patientId, patientName: patient.name, doctorId, doctorName: doctor.name, date, time, fee: doctor.fee || 100, status: 'Scheduled' };
      doctor.consultsCount += 1;
      store.appointments.unshift(newApt);
      return res.status(201).json({ success: true, data: newApt });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Admin, Receptionist, Staff)
router.put('/:id/reschedule', protect, authorize('Admin', 'Receptionist', 'Staff'), async (req, res) => {
  try {
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ success: false, error: 'New Date and Time are required for rescheduling.' });
    }

    if (mongoose.connection.readyState === 1) {
      const appointment = await Appointment.findOne({ id: req.params.id });
      if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });

      if (appointment.status !== 'Scheduled') {
        return res.status(400).json({ success: false, error: 'Only Scheduled appointments can be rescheduled.' });
      }

      // Check slot conflict for the doctor on the new date & time (excluding current appointment)
      const overlap = await Appointment.findOne({
        doctorId: appointment.doctorId,
        date: newDate,
        time: newTime,
        status: 'Scheduled',
        id: { $ne: req.params.id }
      });

      if (overlap) {
        return res.status(400).json({
          success: false,
          error: `Slot Conflict: ${appointment.doctorName} already has an appointment booked on ${newDate} at ${newTime}. Please select an available slot.`
        });
      }

      const oldDate = appointment.date;
      const oldTime = appointment.time;

      appointment.date = newDate;
      appointment.time = newTime;
      await appointment.save();

      return res.json({
        success: true,
        message: `Appointment for ${appointment.patientName} successfully rescheduled from ${oldDate} ${oldTime} to ${newDate} ${newTime}.`,
        data: appointment
      });
    } else {
      const store = global.memoryStore;
      const apt = store.appointments.find(a => a.id === req.params.id);

      if (!apt) return res.status(404).json({ success: false, error: 'Appointment not found' });
      if (apt.status !== 'Scheduled') {
        return res.status(400).json({ success: false, error: 'Only Scheduled appointments can be rescheduled.' });
      }

      const overlap = store.appointments.find(
        a => a.doctorId === apt.doctorId && a.date === newDate && a.time === newTime && a.status === 'Scheduled' && a.id !== req.params.id
      );

      if (overlap) {
        return res.status(400).json({
          success: false,
          error: `Slot Conflict: ${apt.doctorName} already has an appointment booked on ${newDate} at ${newTime}. Please select an available slot.`
        });
      }

      const oldDate = apt.date;
      const oldTime = apt.time;

      apt.date = newDate;
      apt.time = newTime;

      return res.json({
        success: true,
        message: `Appointment for ${apt.patientName} successfully rescheduled from ${oldDate} ${oldTime} to ${newDate} ${newTime}.`,
        data: apt
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Admin, Receptionist, Staff)
router.put('/:id/cancel', protect, authorize('Admin', 'Receptionist', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const appointment = await Appointment.findOne({ id: req.params.id });
      if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });
      if (appointment.status === 'Scheduled') {
        appointment.status = 'Cancelled';
        await appointment.save();
        const doctor = await Doctor.findOne({ id: appointment.doctorId });
        if (doctor) { doctor.consultsCount = Math.max(0, doctor.consultsCount - 1); await doctor.save(); }
      }
      return res.json({ success: true, data: appointment });
    } else {
      const store = global.memoryStore;
      const apt = store.appointments.find(a => a.id === req.params.id);
      if (apt && apt.status === 'Scheduled') {
        apt.status = 'Cancelled';
        const doc = store.doctors.find(d => d.id === apt.doctorId);
        if (doc) doc.consultsCount = Math.max(0, doc.consultsCount - 1);
      }
      return res.json({ success: true, data: apt });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
