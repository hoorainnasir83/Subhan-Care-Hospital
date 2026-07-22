const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const patients = await Patient.find({}).sort({ registeredDate: -1 });
      return res.json({ success: true, count: patients.length, data: patients });
    }
    const patients = global.memoryStore.patients;
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Register new patient
// @route   POST /api/patients
// @access  Private (Admin, Receptionist, Staff)
router.post('/', protect, authorize('Admin', 'Receptionist', 'Staff'), async (req, res) => {
  try {
    const { name, dob, gender, cnic, phone, email, bloodGroup, emergencyContact, address } = req.body;

    if (mongoose.connection.readyState === 1) {
      const duplicate = await Patient.findOne({ cnic: cnic.trim() });
      if (duplicate) {
        return res.status(400).json({ success: false, error: `TC-01: A patient with CNIC "${cnic}" is already registered.` });
      }

      const patients = await Patient.find({});
      let maxNum = 10000;
      patients.forEach(p => {
        const match = p.id.match(/SC-PAT-(\d+)/);
        if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
      });
      const patId = `SC-PAT-${maxNum + 1}`;

      const patient = await Patient.create({
        id: patId, name, dob, gender, cnic: cnic.trim(), phone, email, bloodGroup, emergencyContact, address,
        registeredDate: new Date().toISOString().split('T')[0]
      });

      return res.status(201).json({ success: true, data: patient });
    } else {
      const store = global.memoryStore;
      const duplicate = store.patients.find(p => p.cnic && p.cnic.trim() === cnic.trim());
      if (duplicate) {
        return res.status(400).json({ success: false, error: `TC-01: A patient with CNIC "${cnic}" is already registered.` });
      }

      let maxNum = 10000;
      store.patients.forEach(p => {
        const match = p.id.match(/SC-PAT-(\d+)/);
        if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
      });
      const patId = `SC-PAT-${maxNum + 1}`;

      const dobDate = new Date(dob);
      const age = Math.floor((Date.now() - dobDate.getTime()) / (365.25 * 24 * 3600 * 1000));

      const newPatient = {
        id: patId, name, dob, age, gender, cnic: cnic.trim(), phone, email, bloodGroup, emergencyContact, address,
        registeredDate: new Date().toISOString().split('T')[0]
      };
      store.patients.unshift(newPatient);
      return res.status(201).json({ success: true, data: newPatient });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin, Staff)
router.delete('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const patient = await Patient.findOne({ id: req.params.id });
      if (!patient) return res.status(404).json({ success: false, error: 'Patient registry not found' });
      await Patient.deleteOne({ id: req.params.id });
      return res.json({ success: true, message: 'Patient removed successfully' });
    }
    const store = global.memoryStore;
    store.patients = store.patients.filter(p => p.id !== req.params.id);
    res.json({ success: true, message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
