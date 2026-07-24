const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (Admin, Billing, Staff)
router.get('/', protect, authorize('Admin', 'Billing', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const invoices = await Invoice.find({}).sort({ date: -1 });
      return res.json({ success: true, count: invoices.length, data: invoices });
    }
    res.json({ success: true, count: global.memoryStore.invoices.length, data: global.memoryStore.invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private (Admin, Billing, Staff)
router.post('/', protect, authorize('Admin', 'Billing', 'Staff'), async (req, res) => {
  try {
    const { patientId, date, dueDate, paymentMethod, services, taxRate } = req.body;

    const subtotal = services.reduce((sum, s) => sum + Number(s.cost), 0);
    const taxRateNum = Number(taxRate) || 0;
    const taxAmount = Number((subtotal * taxRateNum / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

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
        taxRate: taxRateNum,
        taxAmount,
        totalAmount,
        status: 'Unpaid'
      });

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
        taxRate: taxRateNum,
        taxAmount,
        totalAmount,
        status: 'Unpaid'
      };

      store.invoices.unshift(newInvoice);
      return res.status(201).json({ success: true, data: newInvoice });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

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
      return res.json({ success: true, data: invoice });
    } else {
      const store = global.memoryStore;
      const inv = store.invoices.find(i => i.id === req.params.id);
      if (inv) inv.status = 'Paid';
      return res.json({ success: true, data: inv });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
