const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

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
