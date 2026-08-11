const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const logger = require('../config/logger');
const notifications = require('../utils/notifications');
const { protect, authorize } = require('../middleware/auth');
const { invoiceValidation, sanitizeQueryParams, handleValidationErrors } = require('../middleware/sanitization');
const { cacheMiddleware, clearCachePattern } = require('../config/cache');

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieve a list of all invoices. Requires Admin, Billing, or Staff role.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term for filtering invoices by patient name or invoice ID
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
 *         description: Invoices retrieved successfully
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
 *                   example: 12
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       500:
 *         description: Server error
 */
// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (Admin, Billing, Staff)
router.get('/', protect, authorize('Admin', 'Billing', 'Staff'), cacheMiddleware(300), sanitizeQueryParams, async (req, res) => {
  try {
    logger.info('Fetching invoices', { userId: req.user._id || req.user.id });
    
    if (mongoose.connection.readyState === 1) {
      const invoices = await Invoice.find({}).sort({ date: -1 });
      logger.info('Invoices fetched successfully', { count: invoices.length });
      return res.json({ success: true, count: invoices.length, data: invoices });
    }
    logger.info('Invoices fetched from memory store', { count: global.memoryStore.invoices.length });
    res.json({ success: true, count: global.memoryStore.invoices.length, data: global.memoryStore.invoices });
  } catch (error) {
    logger.error('Error fetching invoices', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id || req.user.id
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private (Admin, Billing, Staff)
router.get('/:id', protect, authorize('Admin', 'Billing', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const invoice = await Invoice.findOne({ id: req.params.id });
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
      return res.json({ success: true, data: invoice });
    }
    const invoice = global.memoryStore.invoices.find(i => i.id === req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     description: Create an invoice for a patient. Requires Admin, Billing, or Staff role.
 *     tags:
 *       - Invoices
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
 *               - services
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: SC-PAT-10001
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Invoice date (defaults to today)
 *                 example: 2026-07-27
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Due date for payment (defaults to 7 days from today)
 *                 example: 2026-08-03
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method
 *                 enum: [Cash, Card, Bank Transfer, Insurance]
 *                 default: Cash
 *                 example: Card
 *               services:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - cost
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Consultation
 *                     cost:
 *                       type: number
 *                       minimum: 0
 *                       example: 2000
 *               discount:
 *                 type: number
 *                 description: Discount as a percentage (0-100)
 *                 default: 0
 *                 example: 10
 *               taxRate:
 *                 type: number
 *                 description: Tax rate as percentage
 *                 default: 0
 *                 example: 17
 *               notes:
 *                 type: string
 *                 description: Optional billing notes
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private (Admin, Billing, Staff)
router.post('/', protect, authorize('Admin', 'Billing', 'Staff'), invoiceValidation, async (req, res) => {
  try {
    const { patientId, date, dueDate, paymentMethod, services, taxRate, discount, notes } = req.body;

    const subtotal       = services.reduce((sum, s) => sum + Number(s.cost), 0);
    const discountNum    = Math.min(100, Math.max(0, Number(discount) || 0));
    const discountAmount = Number((subtotal * discountNum / 100).toFixed(2));
    const taxRateNum     = Number(taxRate) || 0;
    const taxAmount      = Number(((subtotal - discountAmount) * taxRateNum / 100).toFixed(2));
    const totalAmount    = Number((subtotal - discountAmount + taxAmount).toFixed(2));

    if (mongoose.connection.readyState === 1) {
      const patient = await Patient.findOne({ id: patientId });
      if (!patient) return res.status(404).json({ success: false, error: 'Patient not found in registry' });

      const invId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

      const invoice = await Invoice.create({
        id: invId,
        patientId,
        patientName: patient.name,
        date: date || new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Cash',
        services: services.map(s => ({ name: s.name, cost: Number(s.cost) })),
        subtotal,
        discount: discountNum,
        discountAmount,
        taxRate: taxRateNum,
        taxAmount,
        totalAmount,
        notes: notes || '',
        status: 'Unpaid'
      });

      clearCachePattern('/api/invoices*');
      logger.info('Invoice created', { id: invId, patientId, userId: req.user._id || req.user.id });

      try {
        const patient = await Patient.findOne({ id: patientId });
        notifications.invoiceCreated(req.app, invoice, patient);
      } catch (err) {
        logger.error('Failed to trigger invoice notifications', { error: err.message, invoiceId: invId });
      }

      return res.status(201).json({ success: true, data: invoice });
    } else {
      const store = global.memoryStore;
      const patient = store.patients.find(p => p.id === patientId);
      if (!patient) return res.status(404).json({ success: false, error: 'Patient not found in registry' });

      const invId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

      const newInvoice = {
        id: invId,
        patientId,
        patientName: patient.name,
        date: date || new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Cash',
        services: services.map(s => ({ name: s.name, cost: Number(s.cost) })),
        subtotal,
        discount: discountNum,
        discountAmount,
        taxRate: taxRateNum,
        taxAmount,
        totalAmount,
        notes: notes || '',
        status: 'Unpaid'
      };

      store.invoices.unshift(newInvoice);
      clearCachePattern('/api/invoices*');
      logger.info('Invoice created in memory store', { id: invId, patientId });

      try {
        const patient = store.patients.find(p => p.id === patientId);
        notifications.invoiceCreated(req.app, newInvoice, patient);
      } catch (err) {
        logger.error('Failed to trigger invoice notifications (memory)', { error: err.message, invoiceId: invId });
      }

      return res.status(201).json({ success: true, data: newInvoice });
    }
  } catch (error) {
    logger.error('Error creating invoice', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /invoices/{id}/pay:
 *   put:
 *     summary: Mark invoice as paid
 *     description: Update an invoice status to "Paid". Requires Admin, Billing, or Staff role.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice marked as paid successfully
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
// @desc    Mark invoice as paid
// @route   PUT /api/invoices/:id/pay
// @access  Private (Admin, Billing, Staff)
router.put('/:id/pay', protect, authorize('Admin', 'Billing', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const invoice = await Invoice.findOne({ id: req.params.id });
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice record not found' });

      invoice.status = 'Paid';
      await invoice.save();
      clearCachePattern('/api/invoices*');
      logger.info('Invoice marked paid', { id: req.params.id, userId: req.user._id || req.user.id });

      try {
        const patient = await Patient.findOne({ id: invoice.patientId });
        notifications.invoicePaid(req.app, invoice, patient);
      } catch (err) {
        logger.error('Failed to trigger invoice paid notifications', { error: err.message, invoiceId: req.params.id });
      }

      return res.json({ success: true, data: invoice });
    } else {
      const store = global.memoryStore;
      const inv = store.invoices.find(i => i.id === req.params.id);
      if (!inv) return res.status(404).json({ success: false, error: 'Invoice record not found' });
      inv.status = 'Paid';
      clearCachePattern('/api/invoices*');

      try {
        const patient = store.patients.find(p => p.id === inv.patientId);
        notifications.invoicePaid(req.app, inv, patient);
      } catch (err) {
        logger.error('Failed to trigger invoice paid notifications (memory)', { error: err.message, invoiceId: req.params.id });
      }

      return res.json({ success: true, data: inv });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const invoice = await Invoice.findOne({ id: req.params.id });
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
      await Invoice.deleteOne({ id: req.params.id });
      clearCachePattern('/api/invoices*');
      logger.info('Invoice deleted', { id: req.params.id, userId: req.user._id || req.user.id });
      return res.json({ success: true, message: 'Invoice deleted successfully' });
    }
    const store = global.memoryStore;
    const idx = store.invoices.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Invoice not found' });
    store.invoices.splice(idx, 1);
    clearCachePattern('/api/invoices*');
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
