const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const logger = require('../config/logger');
const { protect, authorize } = require('../middleware/auth');
const { medicineValidation, sanitizeQueryParams, handleValidationErrors } = require('../middleware/sanitization');
const { cacheMiddleware, clearCachePattern } = require('../config/cache');

// ─── Helper: Init memory store medicines array if not present ────────────────
const getMemMedicines = () => {
  if (!global.memoryStore.medicines) global.memoryStore.medicines = [];
  return global.memoryStore.medicines;
};

// ─── Helper: Is stock low? ───────────────────────────────────────────────────
const isLowStock = (med) => med.stockQuantity <= med.lowStockThreshold;

// ─── Helper: Is expiring within N days? ─────────────────────────────────────
const isExpiringSoon = (expiryDate, days = 30) => {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate) - new Date();
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
};

/**
 * @desc    Get all medicines (with search & pagination)
 * @route   GET /api/inventory
 * @access  Private (All authenticated roles)
 */
router.get('/', protect, cacheMiddleware(300), sanitizeQueryParams, async (req, res) => {
  try {
    logger.info('Fetching inventory', { userId: req.user._id || req.user.id });

    const { search = '', category = '', page = 1, limit = 50 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    if (mongoose.connection.readyState === 1) {
      let query = {};

      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { name: regex },
          { genericName: regex },
          { manufacturer: regex },
          { batchNumber: regex }
        ];
      }
      if (category && category !== 'All') {
        query.category = category;
      }

      const total = await Medicine.countDocuments(query);
      const medicines = await Medicine.find(query)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const enriched = medicines.map(m => ({
        ...m.toObject(),
        isLowStock: isLowStock(m),
        isExpiringSoon: isExpiringSoon(m.expiryDate)
      }));

      logger.info('Inventory fetched successfully', { count: enriched.length, total });
      return res.json({ success: true, count: enriched.length, total, data: enriched });
    }

    // Memory store fallback
    let meds = getMemMedicines();
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      meds = meds.filter(m =>
        regex.test(m.name) || regex.test(m.genericName) || regex.test(m.manufacturer) || regex.test(m.batchNumber)
      );
    }
    if (category && category !== 'All') {
      meds = meds.filter(m => m.category === category);
    }

    const total = meds.length;
    const paginated = meds.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    const enriched = paginated.map(m => ({
      ...m,
      isLowStock: isLowStock(m),
      isExpiringSoon: isExpiringSoon(m.expiryDate)
    }));

    logger.info('Inventory fetched from memory store', { count: enriched.length });
    res.json({ success: true, count: enriched.length, total, data: enriched });
  } catch (error) {
    logger.error('Error fetching inventory', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Get low-stock alert medicines
 * @route   GET /api/inventory/low-stock
 * @access  Private (Admin, Staff, Doctor)
 */
router.get('/low-stock', protect, cacheMiddleware(60), async (req, res) => {
  try {
    logger.info('Fetching low-stock medicines', { userId: req.user._id || req.user.id });

    if (mongoose.connection.readyState === 1) {
      const medicines = await Medicine.find({
        $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
      }).sort({ stockQuantity: 1 });

      return res.json({ success: true, count: medicines.length, data: medicines });
    }

    const meds = getMemMedicines().filter(isLowStock);
    meds.sort((a, b) => a.stockQuantity - b.stockQuantity);
    res.json({ success: true, count: meds.length, data: meds });
  } catch (error) {
    logger.error('Error fetching low-stock', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Add a new medicine
 * @route   POST /api/inventory
 * @access  Private (Admin, Staff)
 */
router.post('/', protect, authorize('Admin', 'Staff'), medicineValidation, async (req, res) => {
  try {
    const {
      name, genericName, category, manufacturer, batchNumber,
      expiryDate, purchasePrice, sellingPrice, stockQuantity,
      lowStockThreshold, unit, location, description
    } = req.body;

    const addedQty = Number(stockQuantity) || 0;
    const trimmedName = (name || '').trim();
    const trimmedGeneric = (genericName || '').trim();
    const trimmedBatch = (batchNumber || '').trim();

    if (mongoose.connection.readyState === 1) {
      // Check for existing medicine with same name + genericName + batchNumber
      let existing = null;
      if (trimmedBatch) {
        existing = await Medicine.findOne({
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          genericName: { $regex: new RegExp(`^${trimmedGeneric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          batchNumber: { $regex: new RegExp(`^${trimmedBatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
      }

      if (existing) {
        // Same batch exists — merge stock
        const previousQty = existing.stockQuantity;
        existing.stockQuantity = previousQty + addedQty;
        await existing.save();
        clearCachePattern('/api/inventory*');
        logger.info('Medicine stock merged (same batch)', {
          id: existing.id, name: trimmedName, batch: trimmedBatch,
          previousQty, addedQty, newQty: existing.stockQuantity,
          userId: req.user._id || req.user.id
        });
        return res.status(200).json({
          success: true,
          data: existing,
          stockMerged: true,
          previousQuantity: previousQty,
          addedQuantity: addedQty,
          message: `Existing batch found. Stock has been increased from ${previousQty} to ${existing.stockQuantity}.`
        });
      }

      // No duplicate — create new record
      const medId = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
      const medicine = await Medicine.create({
        id: medId, name: trimmedName, genericName: trimmedGeneric, category, manufacturer,
        batchNumber: trimmedBatch, expiryDate, purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice), stockQuantity: addedQty,
        lowStockThreshold: Number(lowStockThreshold) || 10,
        unit, location, description
      });
      clearCachePattern('/api/inventory*');
      logger.info('Medicine added', { id: medId, name: trimmedName, userId: req.user._id || req.user.id });
      return res.status(201).json({ success: true, data: medicine });
    }

    // ── Memory store fallback ─────────────────────────────────────────────────
    const meds = getMemMedicines();
    let existingMem = null;
    if (trimmedBatch) {
      existingMem = meds.find(m =>
        m.name.toLowerCase() === trimmedName.toLowerCase() &&
        (m.genericName || '').toLowerCase() === trimmedGeneric.toLowerCase() &&
        (m.batchNumber || '').toLowerCase() === trimmedBatch.toLowerCase()
      );
    }

    if (existingMem) {
      const previousQty = existingMem.stockQuantity;
      existingMem.stockQuantity = previousQty + addedQty;
      clearCachePattern('/api/inventory*');
      logger.info('Medicine stock merged in memory store (same batch)', {
        id: existingMem.id, name: trimmedName, previousQty, addedQty, newQty: existingMem.stockQuantity
      });
      return res.status(200).json({
        success: true,
        data: existingMem,
        stockMerged: true,
        previousQuantity: previousQty,
        addedQuantity: addedQty,
        message: `Existing batch found. Stock has been increased from ${previousQty} to ${existingMem.stockQuantity}.`
      });
    }

    const medId = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMed = {
      id: medId, name: trimmedName, genericName: trimmedGeneric, category,
      manufacturer: manufacturer || '', batchNumber: trimmedBatch,
      expiryDate, purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice), stockQuantity: addedQty,
      lowStockThreshold: Number(lowStockThreshold) || 10,
      unit: unit || 'Tablets', location: location || '', description: description || '',
      createdAt: new Date().toISOString()
    };

    meds.unshift(newMed);
    clearCachePattern('/api/inventory*');
    logger.info('Medicine added to memory store', { id: medId, name: trimmedName });
    res.status(201).json({ success: true, data: newMed });
  } catch (error) {
    logger.error('Error adding medicine', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Update medicine details
 * @route   PUT /api/inventory/:id
 * @access  Private (Admin, Staff)
 */
router.put('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Sanitize numeric fields
    ['purchasePrice', 'sellingPrice', 'stockQuantity', 'lowStockThreshold'].forEach(f => {
      if (updates[f] !== undefined) updates[f] = Number(updates[f]);
    });

    if (mongoose.connection.readyState === 1) {
      const medicine = await Medicine.findOne({ id });
      if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });

      Object.assign(medicine, updates);
      await medicine.save();
      clearCachePattern('/api/inventory*');
      logger.info('Medicine updated', { id, userId: req.user._id || req.user.id });
      return res.json({ success: true, data: medicine });
    }

    const meds = getMemMedicines();
    const idx = meds.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Medicine not found' });

    meds[idx] = { ...meds[idx], ...updates };
    clearCachePattern('/api/inventory*');
    logger.info('Medicine updated in memory store', { id });
    res.json({ success: true, data: meds[idx] });
  } catch (error) {
    logger.error('Error updating medicine', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Adjust medicine stock (add or remove units)
 * @route   PUT /api/inventory/:id/stock
 * @access  Private (Admin, Staff, Billing)
 */
router.put('/:id/stock', protect, authorize('Admin', 'Staff', 'Billing'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body; // adjustment: positive = add, negative = remove

    if (adjustment === undefined || isNaN(Number(adjustment))) {
      return res.status(400).json({ success: false, error: 'adjustment (number) is required' });
    }

    const adj = Number(adjustment);

    if (mongoose.connection.readyState === 1) {
      const medicine = await Medicine.findOne({ id });
      if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });

      const newQty = medicine.stockQuantity + adj;
      if (newQty < 0) {
        return res.status(400).json({ success: false, error: `Insufficient stock. Current: ${medicine.stockQuantity}` });
      }

      medicine.stockQuantity = newQty;
      await medicine.save();
      clearCachePattern('/api/inventory*');
      logger.info('Stock adjusted', { id, adj, reason, newQty, userId: req.user._id || req.user.id });
      return res.json({
        success: true,
        data: medicine,
        message: `Stock ${adj >= 0 ? 'added' : 'removed'}: ${Math.abs(adj)} ${medicine.unit}. New total: ${newQty}`
      });
    }

    const meds = getMemMedicines();
    const med = meds.find(m => m.id === id);
    if (!med) return res.status(404).json({ success: false, error: 'Medicine not found' });

    const newQty = med.stockQuantity + adj;
    if (newQty < 0) {
      return res.status(400).json({ success: false, error: `Insufficient stock. Current: ${med.stockQuantity}` });
    }

    med.stockQuantity = newQty;
    clearCachePattern('/api/inventory*');
    logger.info('Stock adjusted in memory store', { id, adj, newQty });
    res.json({
      success: true,
      data: med,
      message: `Stock ${adj >= 0 ? 'added' : 'removed'}: ${Math.abs(adj)} ${med.unit}. New total: ${newQty}`
    });
  } catch (error) {
    logger.error('Error adjusting stock', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Delete a medicine
 * @route   DELETE /api/inventory/:id
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const medicine = await Medicine.findOne({ id });
      if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });

      await Medicine.deleteOne({ id });
      clearCachePattern('/api/inventory*');
      logger.info('Medicine deleted', { id, userId: req.user._id || req.user.id });
      return res.json({ success: true, message: 'Medicine removed from inventory' });
    }

    const meds = getMemMedicines();
    const idx = meds.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Medicine not found' });

    meds.splice(idx, 1);
    clearCachePattern('/api/inventory*');
    logger.info('Medicine deleted from memory store', { id });
    res.json({ success: true, message: 'Medicine removed from inventory' });
  } catch (error) {
    logger.error('Error deleting medicine', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
