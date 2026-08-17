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

const Notification = require('../models/Notification');
const { isDbConnected } = require('../config/db');

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let notifications = [];
    if (isDbConnected()) {
      notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    } else {
      global.memoryStore.notifications = global.memoryStore.notifications || [];
      notifications = global.memoryStore.notifications
        .filter(n => n.userId === req.user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50);
    }
    res.json({ success: true, data: notifications });
  } catch (err) {
    logger.error('Failed to get notifications', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    if (isDbConnected()) {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { read: true },
        { new: true }
      );
      if (!notification) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: notification });
    } else {
      const notification = global.memoryStore.notifications?.find(
        n => n._id === req.params.id && n.userId === req.user.id
      );
      if (!notification) return res.status(404).json({ success: false, error: 'Not found' });
      notification.read = true;
      res.json({ success: true, data: notification });
    }
  } catch (err) {
    logger.error('Failed to mark notification as read', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification (Internal/Admin use)
// @access  Private
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    let newNotif;
    
    if (isDbConnected()) {
      newNotif = await Notification.create({ userId, title, message, type });
    } else {
      global.memoryStore.notifications = global.memoryStore.notifications || [];
      newNotif = {
        _id: 'notif-' + Date.now(),
        userId, title, message, type: type || 'General', read: false, createdAt: new Date()
      };
      global.memoryStore.notifications.push(newNotif);
    }

    // Emit via Socket.io if configured
    const io = req.app.get('io');
    if (io) {
      io.emit(`notification-${userId}`, newNotif);
    }

    res.status(201).json({ success: true, data: newNotif });
  } catch (err) {
    logger.error('Failed to create notification', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
