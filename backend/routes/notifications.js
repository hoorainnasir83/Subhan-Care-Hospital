const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendSms, getTwilioConfig } = require('../config/twilioService');
const logger = require('../config/logger');

// POST /api/notifications/sms
// body: { to: '+923001234567', message: 'Text' }
router.post('/sms', protect, authorize('Admin', 'Billing', 'Staff'), async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ success: false, error: 'to and message are required' });

    const cfg = await getTwilioConfig();
    if (!cfg) return res.status(500).json({ success: false, error: 'Twilio not configured' });

    const result = await sendSms(to, message);
    logger.info('SMS sent via notifications route', { to, sid: result.sid });
    res.json({ success: true, data: { sid: result.sid } });
  } catch (err) {
    logger.error('Failed to send SMS', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
