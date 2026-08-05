const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const logger = require('../config/logger');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeQueryParams } = require('../middleware/sanitization');
const { cacheMiddleware, clearCachePattern } = require('../config/cache');

// ─── Memory Store Helper ──────────────────────────────────────────────────────
const getMemPrescriptions = () => {
  if (!global.memoryStore.prescriptions) global.memoryStore.prescriptions = [];
  return global.memoryStore.prescriptions;
};

const getMemMedicines = () => {
  if (!global.memoryStore.medicines) global.memoryStore.medicines = [];
  return global.memoryStore.medicines;
};

const generatePrescriptionId = () => `RX-${Math.floor(10000 + Math.random() * 90000)}`;

// Helper to deduct medicine stock upon prescription creation/refill
const deductStockForMedications = async (medications) => {
  const deductionLogs = [];
  for (const med of medications) {
    if (!med.name) continue;
    // Quantity to deduct: if duration is present, deduct 1 unit per day or standard duration count, default 10
    const qtyToDeduct = Math.max(1, parseInt(med.duration) || 1);

    if (mongoose.connection.readyState === 1) {
      // Find matching medicine by name (case-insensitive regex)
      const regex = new RegExp(`^${med.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const foundMed = await Medicine.findOne({ name: regex });
      if (foundMed) {
        foundMed.stockQuantity = Math.max(0, foundMed.stockQuantity - qtyToDeduct);
        await foundMed.save();
        const lowStockAlert = foundMed.stockQuantity <= foundMed.lowStockThreshold;
        deductionLogs.push({
          medicineId: foundMed.id,
          name: foundMed.name,
          deducted: qtyToDeduct,
          remainingStock: foundMed.stockQuantity,
          lowStockAlert
        });
        logger.info('Auto stock deduction successful (DB)', { medicine: foundMed.name, deducted: qtyToDeduct, remaining: foundMed.stockQuantity });
      }
    } else {
      // Memory Store Fallback
      const memMeds = getMemMedicines();
      const regex = new RegExp(`^${med.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const idx = memMeds.findIndex(m => regex.test(m.name));
      if (idx !== -1) {
        memMeds[idx].stockQuantity = Math.max(0, memMeds[idx].stockQuantity - qtyToDeduct);
        const lowStockAlert = memMeds[idx].stockQuantity <= (memMeds[idx].lowStockThreshold || 10);
        deductionLogs.push({
          medicineId: memMeds[idx].id,
          name: memMeds[idx].name,
          deducted: qtyToDeduct,
          remainingStock: memMeds[idx].stockQuantity,
          lowStockAlert
        });
        logger.info('Auto stock deduction successful (MemoryStore)', { medicine: memMeds[idx].name, deducted: qtyToDeduct, remaining: memMeds[idx].stockQuantity });
      }
    }
  }
  clearCachePattern('/api/inventory*');
  return deductionLogs;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();

const canRefill = (rx) => {
  if (rx.status !== 'Active') return { ok: false, reason: `Prescription is ${rx.status}` };
  if (isExpired(rx.expiryDate)) return { ok: false, reason: 'Prescription has expired' };
  if (rx.refillsUsed >= rx.refillsAllowed) return { ok: false, reason: 'No refills remaining' };
  return { ok: true, reason: null };
};

// ─── POST /api/prescriptions — Create (With Auto Stock Deduction) ────────────
router.post('/', protect, authorize('Admin', 'Doctor'), async (req, res) => {
  try {
    const { patientId, patientName, doctorId, doctorName, appointmentId,
            medications, diagnosis, notes, issuedDate, expiryDate,
            followUpDate, refillsAllowed } = req.body;

    if (!patientId || !diagnosis || !medications?.length) {
      return res.status(400).json({ success: false, error: 'patientId, diagnosis, and at least one medication are required' });
    }
    if (medications.length > 20) {
      return res.status(400).json({ success: false, error: 'Cannot exceed 20 medications per prescription' });
    }

    const FREQ_ENUM = ['Once daily','Twice daily','Thrice daily','As needed','Every 4 hours','Every 6 hours','Every 8 hours','Every 12 hours'];
    for (const med of medications) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        return res.status(400).json({ success: false, error: 'Each medication requires name, dosage, frequency, and duration' });
      }
      if (!FREQ_ENUM.includes(med.frequency)) {
        return res.status(400).json({ success: false, error: `Invalid frequency "${med.frequency}"` });
      }
    }

    const issued  = issuedDate  || new Date().toISOString().split('T')[0];
    const expiry  = expiryDate  || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const presId  = generatePrescriptionId();
    const docId   = doctorId   || req.user.doctorId || req.user.id;
    const docName = doctorName || req.user.name || 'Doctor';
    const createdBy = req.user.id;

    // Deduct stock for all prescribed medicines
    const deductionLogs = await deductStockForMedications(medications);

    if (mongoose.connection.readyState === 1) {
      const rx = await Prescription.create({
        prescriptionId: presId, patientId, patientName: patientName || 'Patient',
        doctorId: docId, doctorName: docName, appointmentId: appointmentId || null,
        medications, diagnosis: diagnosis.trim(), notes: notes || '',
        issuedDate: issued, expiryDate: expiry, followUpDate: followUpDate || null,
        refillsAllowed: refillsAllowed || 0, refillsUsed: 0,
        status: 'Active', createdBy
      });
      clearCachePattern('/api/prescriptions*');
      logger.info('Prescription created with stock deduction', { prescriptionId: presId, patientId, userId: req.user.id });
      return res.status(201).json({ success: true, data: rx, stockDeductions: deductionLogs });
    }

    // Memory store fallback
    const mem = getMemPrescriptions();
    const newRx = {
      _id: `rx-${Date.now()}`, prescriptionId: presId,
      patientId, patientName: patientName || 'Patient',
      doctorId: docId, doctorName: docName, appointmentId: appointmentId || null,
      medications, diagnosis: diagnosis.trim(), notes: notes || '',
      issuedDate: issued, expiryDate: expiry, followUpDate: followUpDate || null,
      refillsAllowed: refillsAllowed || 0, refillsUsed: 0,
      status: 'Active', createdBy,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    mem.unshift(newRx);
    clearCachePattern('/api/prescriptions*');
    logger.info('Prescription created in memory store with stock deduction', { prescriptionId: presId, patientId });
    return res.status(201).json({ success: true, data: newRx, stockDeductions: deductionLogs });

  } catch (err) {
    logger.error('Error creating prescription', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/prescriptions — List (with filters & pagination) ────────────────
router.get('/', protect, sanitizeQueryParams, cacheMiddleware(300), async (req, res) => {
  try {
    const { patientId, doctorId, status, search = '', page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const role     = req.user.role;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (role === 'Patient') query.patientId = req.user.patientId;
      else if (role === 'Doctor') query.doctorId = req.user.doctorId || req.user.id;
      else {
        if (patientId) query.patientId = patientId;
        if (doctorId)  query.doctorId  = doctorId;
      }
      if (status && status !== 'All') query.status = status;
      if (search) {
        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ diagnosis: re }, { 'medications.name': re }];
      }
      const total = await Prescription.countDocuments(query);
      const data  = await Prescription.find(query)
        .sort({ issuedDate: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum).limit(limitNum);
      return res.json({ success: true, count: data.length, total, data });
    }

    // Memory store fallback
    let mem = getMemPrescriptions();
    if (role === 'Patient') mem = mem.filter(r => r.patientId === req.user.patientId);
    else if (role === 'Doctor') mem = mem.filter(r => r.doctorId === (req.user.doctorId || req.user.id));
    else {
      if (patientId) mem = mem.filter(r => r.patientId === patientId);
      if (doctorId)  mem = mem.filter(r => r.doctorId  === doctorId);
    }
    if (status && status !== 'All') mem = mem.filter(r => r.status === status);
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      mem = mem.filter(r => re.test(r.diagnosis) || r.medications.some(m => re.test(m.name)));
    }
    const total    = mem.length;
    const paginated = mem.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    res.json({ success: true, count: paginated.length, total, data: paginated });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/prescriptions/:id/refill-status ────────────────────────────────
router.get('/:id/refill-status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    let rx;
    if (mongoose.connection.readyState === 1) {
      rx = await Prescription.findOne({ $or: [{ _id: id }, { prescriptionId: id }] });
    } else {
      rx = getMemPrescriptions().find(r => r._id === id || r.prescriptionId === id);
    }
    if (!rx) return res.status(404).json({ success: false, error: 'Prescription not found' });

    const { ok, reason } = canRefill(rx);
    const expDate   = new Date(rx.expiryDate);
    const daysLeft  = Math.ceil((expDate - new Date()) / 86400000);
    res.json({
      success: true,
      data: {
        canRefill: ok,
        reason: reason || 'Eligible for refill',
        refillsRemaining: Math.max(0, (rx.refillsAllowed || 0) - (rx.refillsUsed || 0)),
        daysUntilExpiry: Math.max(0, daysLeft)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/prescriptions/:id — Single ─────────────────────────────────────
router.get('/:id', protect, cacheMiddleware(300), async (req, res) => {
  try {
    const { id } = req.params;
    let rx;
    if (mongoose.connection.readyState === 1) {
      rx = await Prescription.findOne({ $or: [{ _id: id }, { prescriptionId: id }] });
    } else {
      rx = getMemPrescriptions().find(r => r._id === id || r.prescriptionId === id);
    }
    if (!rx) return res.status(404).json({ success: false, error: 'Prescription not found' });

    if (req.user.role === 'Patient' && rx.patientId !== req.user.patientId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.json({ success: true, data: rx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/prescriptions/:id — Update ─────────────────────────────────────
router.put('/:id', protect, authorize('Admin', 'Doctor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { medications, diagnosis, notes, expiryDate, refillsAllowed, followUpDate } = req.body;

    if (mongoose.connection.readyState === 1) {
      const rx = await Prescription.findOne({ $or: [{ _id: id }, { prescriptionId: id }] });
      if (!rx) return res.status(404).json({ success: false, error: 'Prescription not found' });
      if (rx.status !== 'Active') return res.status(400).json({ success: false, error: `Cannot update a ${rx.status} prescription` });

      if (medications)     rx.medications     = medications;
      if (diagnosis)       rx.diagnosis       = diagnosis.trim();
      if (notes !== undefined) rx.notes       = notes;
      if (expiryDate)      rx.expiryDate      = expiryDate;
      if (refillsAllowed !== undefined) rx.refillsAllowed = refillsAllowed;
      if (followUpDate !== undefined)   rx.followUpDate   = followUpDate;

      await rx.save();
      clearCachePattern('/api/prescriptions*');
      logger.info('Prescription updated', { id, userId: req.user.id });
      return res.json({ success: true, data: rx });
    }

    const mem = getMemPrescriptions();
    const idx = mem.findIndex(r => r._id === id || r.prescriptionId === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Prescription not found' });
    if (mem[idx].status !== 'Active') return res.status(400).json({ success: false, error: `Cannot update a ${mem[idx].status} prescription` });

    const allowed = {};
    if (medications)     allowed.medications     = medications;
    if (diagnosis)       allowed.diagnosis       = diagnosis.trim();
    if (notes !== undefined) allowed.notes       = notes;
    if (expiryDate)      allowed.expiryDate      = expiryDate;
    if (refillsAllowed !== undefined) allowed.refillsAllowed = refillsAllowed;
    if (followUpDate !== undefined)   allowed.followUpDate   = followUpDate;

    mem[idx] = { ...mem[idx], ...allowed, updatedAt: new Date().toISOString() };
    clearCachePattern('/api/prescriptions*');
    logger.info('Prescription updated in memory store', { id });
    res.json({ success: true, data: mem[idx] });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/prescriptions/:id — Soft Delete (→ Cancelled) ───────────────
router.delete('/:id', protect, authorize('Admin', 'Doctor'), async (req, res) => {
  try {
    const { id } = req.params;
    const cancelledDate = new Date().toISOString().split('T')[0];
    const cancelledBy   = req.user.id;

    if (mongoose.connection.readyState === 1) {
      const rx = await Prescription.findOne({ $or: [{ _id: id }, { prescriptionId: id }] });
      if (!rx) return res.status(404).json({ success: false, error: 'Prescription not found' });
      if (rx.status === 'Cancelled') return res.status(400).json({ success: false, error: 'Prescription already cancelled' });

      rx.status = 'Cancelled';
      rx.cancelledBy   = cancelledBy;
      rx.cancelledDate = cancelledDate;
      await rx.save();
      clearCachePattern('/api/prescriptions*');
      logger.info('Prescription cancelled (soft delete)', { id, userId: req.user.id });
      return res.json({ success: true, message: 'Prescription cancelled successfully', data: rx });
    }

    const mem = getMemPrescriptions();
    const idx = mem.findIndex(r => r._id === id || r.prescriptionId === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Prescription not found' });
    if (mem[idx].status === 'Cancelled') return res.status(400).json({ success: false, error: 'Prescription already cancelled' });

    mem[idx] = { ...mem[idx], status: 'Cancelled', cancelledBy, cancelledDate, updatedAt: new Date().toISOString() };
    clearCachePattern('/api/prescriptions*');
    logger.info('Prescription cancelled in memory store', { id });
    res.json({ success: true, message: 'Prescription cancelled successfully', data: mem[idx] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/prescriptions/:id/refill ──────────────────────────────────────
router.post('/:id/refill', protect, authorize('Admin', 'Doctor'), async (req, res) => {
  try {
    const { id } = req.params;
    let rx;

    if (mongoose.connection.readyState === 1) {
      rx = await Prescription.findOne({ $or: [{ _id: id }, { prescriptionId: id }] });
    } else {
      const mem = getMemPrescriptions();
      rx = mem.find(r => r._id === id || r.prescriptionId === id);
    }
    if (!rx) return res.status(404).json({ success: false, error: 'Prescription not found' });

    const { ok, reason } = canRefill(rx);
    if (!ok) return res.status(400).json({ success: false, error: reason });

    const newPresId = generatePrescriptionId();
    const today    = new Date().toISOString().split('T')[0];
    const newExpiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Deduct stock for refill
    const deductionLogs = await deductStockForMedications(rx.medications);

    if (mongoose.connection.readyState === 1) {
      rx.refillsUsed += 1;
      await rx.save();

      const newRx = await Prescription.create({
        prescriptionId: newPresId, patientId: rx.patientId, patientName: rx.patientName,
        doctorId: rx.doctorId, doctorName: rx.doctorName, appointmentId: null,
        medications: rx.medications, diagnosis: rx.diagnosis, notes: rx.notes,
        issuedDate: today, expiryDate: newExpiry, followUpDate: null,
        refillsAllowed: 0, refillsUsed: 0,
        status: 'Active', parentPrescriptionId: rx.prescriptionId,
        createdBy: req.user.id
      });
      clearCachePattern('/api/prescriptions*');
      logger.info('Prescription refilled with stock deduction', { original: rx.prescriptionId, newId: newPresId });
      return res.status(201).json({ success: true, data: newRx, stockDeductions: deductionLogs });
    }

    // Memory store
    const mem = getMemPrescriptions();
    const origIdx = mem.findIndex(r => r._id === id || r.prescriptionId === id);
    mem[origIdx].refillsUsed = (mem[origIdx].refillsUsed || 0) + 1;
    mem[origIdx].updatedAt   = new Date().toISOString();

    const newRxMem = {
      _id: `rx-${Date.now()}`, prescriptionId: newPresId,
      patientId: rx.patientId, patientName: rx.patientName,
      doctorId: rx.doctorId, doctorName: rx.doctorName, appointmentId: null,
      medications: rx.medications, diagnosis: rx.diagnosis, notes: rx.notes,
      issuedDate: today, expiryDate: newExpiry, followUpDate: null,
      refillsAllowed: 0, refillsUsed: 0,
      status: 'Active', parentPrescriptionId: rx.prescriptionId,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    mem.unshift(newRxMem);
    clearCachePattern('/api/prescriptions*');
    logger.info('Prescription refilled in memory store with stock deduction', { original: rx.prescriptionId, newId: newPresId });
    res.status(201).json({ success: true, data: newRxMem, stockDeductions: deductionLogs });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
