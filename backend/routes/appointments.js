const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const logger = require('../config/logger');
const { protect, authorize } = require('../middleware/auth');
const { appointmentValidation, sanitizeQueryParams, handleValidationErrors } = require('../middleware/sanitization');

const ALL_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

/**
 * @swagger
 * /appointments/available-slots:
 *   get:
 *     summary: Get available appointment slots for a doctor
 *     description: Retrieve available time slots for a specific doctor on a given date
 *     tags:
 *       - Appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 doctorId:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date
 *                 allSlots:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["08:00", "08:30", "09:00"]
 *                 bookedSlots:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["09:00", "09:30"]
 *                 availableSlots:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["08:00", "08:30", "10:00"]
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get all appointments
 *     description: Retrieve appointments. Doctors see only their own appointments, others see all appointments.
 *     tags:
 *       - Appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term for filtering appointments
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
// @desc    Get all appointments (scoped by role)
// @route   GET /api/appointments
// @access  Private
router.get('/', protect, sanitizeQueryParams, async (req, res) => {
  try {
    logger.info('Fetching appointments', { userId: req.user._id || req.user.id, role: req.user.role });
    
    let query = {};
    if (req.user.role === 'Doctor' && req.user.doctorId) {
      query.doctorId = req.user.doctorId;
    }

    if (mongoose.connection.readyState === 1) {
      const appointments = await Appointment.find(query).sort({ date: -1, time: -1 });
      logger.info('Appointments fetched successfully', { count: appointments.length });
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

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book a new appointment
 *     description: Create a new appointment between a patient and doctor. Requires Admin, Receptionist, or Staff role.
 *     tags:
 *       - Appointments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *               - date
 *               - time
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: SC-PAT-10001
 *               doctorId:
 *                 type: string
 *                 example: doc-1234567890
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-15
 *               time:
 *                 type: string
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "14:30"
 *                 description: Appointment time in HH:MM 24-hour format
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error or slot already booked
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       404:
 *         description: Patient or Doctor not found
 *       500:
 *         description: Server error
 */
// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Staff)
router.post('/', protect, authorize('Admin', 'Receptionist', 'Staff'), appointmentValidation, async (req, res) => {
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

/**
 * @swagger
 * /appointments/{id}/reschedule:
 *   put:
 *     summary: Reschedule an appointment
 *     description: Change the date and/or time of an existing appointment. Only Scheduled appointments can be rescheduled.
 *     tags:
 *       - Appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newDate
 *               - newTime
 *             properties:
 *               newDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-20
 *               newTime:
 *                 type: string
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "15:00"
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid request or slot conflict
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     description: Cancel a scheduled appointment. Only Scheduled appointments can be cancelled.
 *     tags:
 *       - Appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID to cancel
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
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
