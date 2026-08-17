const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MedicalRecord = require('../models/MedicalRecord');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../config/logger');

// Initialize memory store for medical records if it doesn't exist
if (!global.memoryStore) global.memoryStore = {};
if (!global.memoryStore.medicalRecords) global.memoryStore.medicalRecords = [];

// Helper to check DB connection
const isDbConnected = () => mongoose.connection.readyState === 1;

// @route   GET /api/medical-records
// @desc    Get all medical records
// @access  Private (Admin, Doctor, Staff)
router.get('/', protect, authorize('Admin', 'Doctor', 'Staff'), async (req, res) => {
  try {
    if (isDbConnected()) {
      const records = await MedicalRecord.find().sort({ visitDate: -1 });
      return res.json({ success: true, count: records.length, data: records });
    } else {
      const records = global.memoryStore.medicalRecords.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      return res.json({ success: true, count: records.length, data: records, fallback: true });
    }
  } catch (error) {
    logger.error(`Error fetching medical records: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get records for a specific patient
// @access  Private (Admin, Doctor, Staff, Patient)
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    // Basic RBAC: If patient, they can only view their own records
    if (req.user.role === 'Patient' && req.user.patientId !== req.params.patientId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these records' });
    }

    if (isDbConnected()) {
      const records = await MedicalRecord.find({ patientId: req.params.patientId }).sort({ visitDate: -1 });
      return res.json({ success: true, count: records.length, data: records });
    } else {
      const records = global.memoryStore.medicalRecords
        .filter(r => r.patientId === req.params.patientId)
        .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      return res.json({ success: true, count: records.length, data: records, fallback: true });
    }
  } catch (error) {
    logger.error(`Error fetching patient medical records: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/medical-records
// @desc    Create a new medical record
// @access  Private (Admin, Doctor)
router.post('/', protect, authorize('Admin', 'Doctor'), async (req, res) => {
  try {
    const { 
      patientId, patientName, doctorId, doctorName, appointmentId, 
      visitDate, chiefComplaint, symptoms, diagnosis, treatment, 
      medications, labResults, vitalSigns, allergies, notes, 
      followUpDate, recordType 
    } = req.body;
    // Prevent Duplicate Records
    // Check if the same patient has the same diagnosis by the same doctor on the same day
    const checkDate = new Date(visitDate || new Date()).toISOString().split('T')[0];
    
    if (isDbConnected()) {
      const existing = await MedicalRecord.find({ patientId, doctorId, diagnosis });
      const isDuplicate = existing.some(r => new Date(r.visitDate).toISOString().split('T')[0] === checkDate);
      if (isDuplicate) {
        return res.status(400).json({ success: false, message: 'A record with this diagnosis already exists for this patient today.' });
      }
    } else {
      const isDuplicate = global.memoryStore.medicalRecords.some(r => 
        r.patientId === patientId && 
        r.doctorId === doctorId && 
        r.diagnosis?.toLowerCase() === diagnosis?.toLowerCase() &&
        new Date(r.visitDate || r.recordDate).toISOString().split('T')[0] === checkDate
      );
      if (isDuplicate) {
        return res.status(400).json({ success: false, message: 'A record with this diagnosis already exists for this patient today.' });
      }
    }

    // Generate a unique ID: SC-MR-XXXXX
    const recordId = `SC-MR-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const recordData = {
      recordId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      appointmentId: appointmentId || null,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      chiefComplaint,
      symptoms: symptoms || [],
      diagnosis,
      treatment: treatment || '',
      medications: medications || [],
      labResults: labResults || [],
      vitalSigns: vitalSigns || {},
      allergies: allergies || [],
      notes: notes || '',
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      recordType: recordType || 'Visit',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      const newRecord = await MedicalRecord.create(recordData);
      logger.info(`Medical record created in MongoDB: ${recordId}`);
      return res.status(201).json({ success: true, data: newRecord });
    } else {
      global.memoryStore.medicalRecords.push(recordData);
      logger.info(`Medical record created in Memory Store: ${recordId}`);
      return res.status(201).json({ success: true, data: recordData, fallback: true });
    }
  } catch (error) {
    logger.error(`Error creating medical record: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/medical-records/:id
// @desc    Update medical record
// @access  Private (Admin, Doctor)
router.put('/:id', protect, authorize('Admin', 'Doctor'), async (req, res) => {
  try {
    if (isDbConnected()) {
      let record = await MedicalRecord.findOne({ recordId: req.params.id });
      if (!record) return res.status(404).json({ success: false, message: 'Medical record not found' });
      
      record = await MedicalRecord.findOneAndUpdate({ recordId: req.params.id }, req.body, { new: true, runValidators: true });
      logger.info(`Medical record updated in MongoDB: ${req.params.id}`);
      return res.json({ success: true, data: record });
    } else {
      const index = global.memoryStore.medicalRecords.findIndex(r => r.recordId === req.params.id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Medical record not found' });
      
      global.memoryStore.medicalRecords[index] = { ...global.memoryStore.medicalRecords[index], ...req.body, updatedAt: new Date() };
      logger.info(`Medical record updated in Memory Store: ${req.params.id}`);
      return res.json({ success: true, data: global.memoryStore.medicalRecords[index], fallback: true });
    }
  } catch (error) {
    logger.error(`Error updating medical record: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/medical-records/:id
// @desc    Delete medical record
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    if (isDbConnected()) {
      const record = await MedicalRecord.findOne({ recordId: req.params.id });
      if (!record) return res.status(404).json({ success: false, message: 'Medical record not found' });
      
      await record.remove();
      logger.info(`Medical record deleted from MongoDB: ${req.params.id}`);
      return res.json({ success: true, data: {} });
    } else {
      const index = global.memoryStore.medicalRecords.findIndex(r => r.recordId === req.params.id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Medical record not found' });
      
      global.memoryStore.medicalRecords.splice(index, 1);
      logger.info(`Medical record deleted from Memory Store: ${req.params.id}`);
      return res.json({ success: true, data: {}, fallback: true });
    }
  } catch (error) {
    logger.error(`Error deleting medical record: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
