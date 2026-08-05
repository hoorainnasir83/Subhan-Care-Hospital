const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const logger = require('../config/logger');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeQueryParams } = require('../middleware/sanitization');
const { cacheMiddleware, clearCachePattern } = require('../config/cache');

// Helper: Init memory store array if missing
const getMemRecords = () => {
  if (!global.memoryStore.medicalRecords) global.memoryStore.medicalRecords = [];
  return global.memoryStore.medicalRecords;
};

/**
 * @desc    Create new Medical Record
 * @route   POST /api/medical-records
 * @access  Private (Admin, Doctor, Staff)
 */
router.post('/', protect, authorize('Admin', 'Doctor', 'Staff'), async (req, res) => {
  try {
    const { 
      patientId, recordType, recordDate, title, description, 
      findings, recommendations, severity, status, tags, 
      appointmentId, followUpDate, isConfidential, notes, attachments 
    } = req.body;

    // Validation
    if (!patientId || !recordType || !title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: patientId, recordType, title, description' 
      });
    }

    const doctorId = req.user.doctorId || req.user.id || 'doc-1';
    const recDate = recordDate || new Date().toISOString().split('T')[0];

    // Duplicate prevention: check if identical record created today for same patient
    if (mongoose.connection.readyState === 1) {
      const existing = await MedicalRecord.findOne({
        patientId,
        doctorId,
        recordType,
        title: title.trim(),
        recordDate: recDate
      });

      if (existing) {
        return res.status(409).json({ 
          success: false, 
          error: 'A medical record with identical title and type was already created for this patient today.' 
        });
      }

      const recordId = `MR-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRecord = await MedicalRecord.create({
        recordId,
        patientId,
        doctorId,
        appointmentId: appointmentId || null,
        recordType,
        recordDate: recDate,
        title: title.trim(),
        description: description.trim(),
        findings: findings || '',
        recommendations: recommendations || '',
        severity: severity || 'Medium',
        status: status || 'Active',
        tags: Array.isArray(tags) ? tags : [],
        isConfidential: Boolean(isConfidential),
        followUpDate: followUpDate || null,
        notes: notes || '',
        attachments: Array.isArray(attachments) ? attachments : [],
        createdBy: req.user.id
      });

      clearCachePattern('/api/medical-records*');
      logger.info('Medical record created', { recordId, patientId, userId: req.user.id });
      return res.status(201).json({ success: true, data: newRecord });
    }

    // Memory Store Fallback
    const memRecords = getMemRecords();
    const existingMem = memRecords.find(r => 
      r.patientId === patientId && 
      r.doctorId === doctorId && 
      r.recordType === recordType && 
      r.title === title.trim() && 
      r.recordDate === recDate
    );

    if (existingMem) {
      return res.status(409).json({ 
        success: false, 
        error: 'A medical record with identical title and type was already created for this patient today.' 
      });
    }

    const recordId = `MR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecordMem = {
      _id: `mr-${Date.now()}`,
      recordId,
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      recordType,
      recordDate: recDate,
      title: title.trim(),
      description: description.trim(),
      findings: findings || '',
      recommendations: recommendations || '',
      severity: severity || 'Medium',
      status: status || 'Active',
      tags: Array.isArray(tags) ? tags : [],
      isConfidential: Boolean(isConfidential),
      followUpDate: followUpDate || null,
      notes: notes || '',
      attachments: Array.isArray(attachments) ? attachments : [],
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memRecords.unshift(newRecordMem);
    clearCachePattern('/api/medical-records*');
    logger.info('Medical record created in memory store', { recordId, patientId });
    return res.status(201).json({ success: true, data: newRecordMem });

  } catch (error) {
    logger.error('Error creating medical record', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Get all Medical Records (with filter, search & pagination)
 * @route   GET /api/medical-records
 * @access  Private (All authenticated roles)
 */
router.get('/', protect, sanitizeQueryParams, cacheMiddleware(300), async (req, res) => {
  try {
    const { patientId, recordType, status, severity, search = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (patientId) query.patientId = patientId;
      if (recordType && recordType !== 'All') query.recordType = recordType;
      if (status && status !== 'All') query.status = status;
      if (severity && severity !== 'All') query.severity = severity;

      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ title: regex }, { description: regex }, { findings: regex }];
      }

      // Restrict confidential records for patients if not own record
      if (req.user.role === 'Patient') {
        query.patientId = req.user.patientId;
        query.isConfidential = false;
      }

      const total = await MedicalRecord.countDocuments(query);
      const records = await MedicalRecord.find(query)
        .sort({ recordDate: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json({ success: true, count: records.length, total, data: records });
    }

    // Memory Store Fallback
    let memRecords = getMemRecords();

    if (req.user.role === 'Patient') {
      memRecords = memRecords.filter(r => r.patientId === req.user.patientId && !r.isConfidential);
    } else if (patientId) {
      memRecords = memRecords.filter(r => r.patientId === patientId);
    }

    if (recordType && recordType !== 'All') memRecords = memRecords.filter(r => r.recordType === recordType);
    if (status && status !== 'All') memRecords = memRecords.filter(r => r.status === status);
    if (severity && severity !== 'All') memRecords = memRecords.filter(r => r.severity === severity);

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      memRecords = memRecords.filter(r => regex.test(r.title) || regex.test(r.description) || regex.test(r.findings));
    }

    const total = memRecords.length;
    const paginated = memRecords.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    res.json({ success: true, count: paginated.length, total, data: paginated });

  } catch (error) {
    logger.error('Error fetching medical records', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Get Patient Timeline
 * @route   GET /api/medical-records/patient/:patientId/timeline
 * @access  Private
 */
router.get('/patient/:patientId/timeline', protect, cacheMiddleware(300), async (req, res) => {
  try {
    const { patientId } = req.params;

    if (mongoose.connection.readyState === 1) {
      const records = await MedicalRecord.find({ patientId })
        .sort({ recordDate: -1, createdAt: -1 });
      return res.json({ success: true, count: records.length, data: records });
    }

    const records = getMemRecords()
      .filter(r => r.patientId === patientId)
      .sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Get Patient Medical Summary
 * @route   GET /api/medical-records/patient/:patientId/summary
 * @access  Private
 */
router.get('/patient/:patientId/summary', protect, cacheMiddleware(300), async (req, res) => {
  try {
    const { patientId } = req.params;

    let records = [];
    if (mongoose.connection.readyState === 1) {
      records = await MedicalRecord.find({ patientId });
    } else {
      records = getMemRecords().filter(r => r.patientId === patientId);
    }

    const activeConditions = records.filter(r => r.status === 'Active').length;
    const surgeries = records.filter(r => r.recordType === 'Surgery').length;
    const followUpsNeeded = records.filter(r => r.status === 'Follow-up Needed').length;

    const severityBreakdown = {
      low: records.filter(r => r.severity === 'Low').length,
      medium: records.filter(r => r.severity === 'Medium').length,
      high: records.filter(r => r.severity === 'High').length,
      critical: records.filter(r => r.severity === 'Critical').length
    };

    const summary = {
      patientId,
      totalRecords: records.length,
      activeConditions,
      surgeries,
      followUpsNeeded,
      severityBreakdown,
      recentRecords: records.slice(0, 5)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Get single Medical Record by ID
 * @route   GET /api/medical-records/:id
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const record = await MedicalRecord.findOne({ $or: [{ _id: id }, { recordId: id }] });
      if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
      return res.json({ success: true, data: record });
    }

    const record = getMemRecords().find(r => r._id === id || r.recordId === id);
    if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, data: record });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Update Medical Record
 * @route   PUT /api/medical-records/:id
 * @access  Private (Admin, Doctor, Staff)
 */
router.put('/:id', protect, authorize('Admin', 'Doctor', 'Staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (mongoose.connection.readyState === 1) {
      const record = await MedicalRecord.findOne({ $or: [{ _id: id }, { recordId: id }] });
      if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

      Object.assign(record, updates);
      await record.save();
      clearCachePattern('/api/medical-records*');
      logger.info('Medical record updated', { id, userId: req.user.id });
      return res.json({ success: true, data: record });
    }

    const memRecords = getMemRecords();
    const idx = memRecords.findIndex(r => r._id === id || r.recordId === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Record not found' });

    memRecords[idx] = { ...memRecords[idx], ...updates, updatedAt: new Date().toISOString() };
    clearCachePattern('/api/medical-records*');
    logger.info('Medical record updated in memory store', { id });
    res.json({ success: true, data: memRecords[idx] });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Delete Medical Record
 * @route   DELETE /api/medical-records/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const record = await MedicalRecord.findOne({ $or: [{ _id: id }, { recordId: id }] });
      if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

      await MedicalRecord.deleteOne({ _id: record._id });
      clearCachePattern('/api/medical-records*');
      logger.info('Medical record deleted', { id, userId: req.user.id });
      return res.json({ success: true, message: 'Medical record deleted successfully' });
    }

    const memRecords = getMemRecords();
    const idx = memRecords.findIndex(r => r._id === id || r.recordId === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Record not found' });

    memRecords.splice(idx, 1);
    clearCachePattern('/api/medical-records*');
    logger.info('Medical record deleted from memory store', { id });
    res.json({ success: true, message: 'Medical record deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
