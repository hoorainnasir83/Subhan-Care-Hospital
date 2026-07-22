const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const doctors = await Doctor.find({});
      return res.json({ success: true, count: doctors.length, data: doctors });
    }
    res.json({ success: true, count: global.memoryStore.doctors.length, data: global.memoryStore.doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Recruit a new doctor
// @route   POST /api/doctors
// @access  Private (Admin, Staff)
router.post('/', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const { name, specialty, phone, email, availability, fee } = req.body;
    const docId = `doc-${Date.now()}`;

    if (mongoose.connection.readyState === 1) {
      const doctor = await Doctor.create({ id: docId, name, specialty, phone, email, availability, fee: Number(fee) || 100, rating: 5.0, consultsCount: 0 });
      return res.status(201).json({ success: true, data: doctor });
    }

    const newDoc = { id: docId, name, specialty, phone, email, availability, fee: Number(fee) || 100, rating: 5.0, consultsCount: 0 };
    global.memoryStore.doctors.unshift(newDoc);
    res.status(201).json({ success: true, data: newDoc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @desc    Remove a doctor from staff
// @route   DELETE /api/doctors/:id
// @access  Private (Admin, Staff)
router.delete('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const doctor = await Doctor.findOne({ id: req.params.id });
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found in roster' });
      await Doctor.deleteOne({ id: req.params.id });
      return res.json({ success: true, message: 'Doctor roster record removed' });
    }
    global.memoryStore.doctors = global.memoryStore.doctors.filter(d => d.id !== req.params.id);
    res.json({ success: true, message: 'Doctor roster record removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
