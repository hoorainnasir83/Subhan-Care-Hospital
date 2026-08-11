const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const mongoose = require('mongoose');
const { createStripeCheckoutSession } = require('../config/paymentService');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const logger = require('../config/logger');
const notifications = require('../utils/notifications');
const { protect, authorize } = require('../middleware/auth');

// Create a Stripe checkout session for an invoice
router.post('/checkout', protect, authorize('Admin', 'Billing', 'Staff'), async (req, res) => {
  try {
    const { invoiceId, successUrl, cancelUrl, customerEmail, currency } = req.body;

    if (!invoiceId) return res.status(400).json({ success: false, error: 'invoiceId is required' });

    let invoice;
    if (mongoose.connection.readyState === 1) {
      invoice = await Invoice.findOne({ id: invoiceId });
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    } else {
      const store = global.memoryStore;
      invoice = store.invoices.find(i => i.id === invoiceId);
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found (memory)' });
    }

    const session = await createStripeCheckoutSession({
      amount: invoice.totalAmount,
      currency: currency || 'usd',
      invoiceId: invoice.id,
      successUrl: successUrl || (process.env.STRIPE_SUCCESS_URL || `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/payments/success`),
      cancelUrl: cancelUrl || (process.env.STRIPE_CANCEL_URL || `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/payments/cancel`),
      customerEmail: customerEmail || invoice.patientEmail || undefined
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('Error creating Stripe checkout session', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stripe webhook endpoint to mark invoices paid
// Note: Stripe requires the raw body for webhook signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

  if (!webhookSecret) {
    logger.warn('Stripe webhook secret not configured; webhook will bypass signature verification');
  }

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata && session.metadata.invoiceId;
      if (invoiceId) {
        if (mongoose.connection.readyState === 1) {
          const invoice = await Invoice.findOne({ id: invoiceId });
          if (invoice) {
            invoice.status = 'Paid';
            await invoice.save();
            const patient = await Patient.findOne({ id: invoice.patientId });
            notifications.invoicePaid(req.app, invoice, patient);
            logger.info('Invoice marked paid via Stripe webhook', { invoiceId });
          }
        } else {
          const store = global.memoryStore;
          const inv = store.invoices.find(i => i.id === invoiceId);
          if (inv) {
            inv.status = 'Paid';
            const patient = store.patients.find(p => p.id === inv.patientId);
            notifications.invoicePaid(req.app, inv, patient);
            logger.info('Invoice marked paid via Stripe webhook (memory)', { invoiceId });
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Error handling Stripe webhook', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
