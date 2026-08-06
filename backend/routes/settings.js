const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const checkDB = () => mongoose.connection.readyState === 1;

// Helper to get or create the singleton settings document
const getSettingsDoc = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  return settings;
};

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database offline' });
    const settings = await getSettingsDoc();
    
    // Create a lean copy and obscure sensitive info
    const safeSettings = settings.toObject();
    if (safeSettings.email) safeSettings.email.password = '';
    if (safeSettings.sms) safeSettings.sms.twilioAuthToken = '';

    res.json({ success: true, data: safeSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// @desc    Update Hospital/General settings
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, authorize('Admin'), async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database offline' });
    const settings = await getSettingsDoc();
    
    if (req.body.hospital) {
      settings.hospital = { ...settings.hospital, ...req.body.hospital };
    }
    if (req.body.email) {
      settings.email = { ...settings.email, ...req.body.email };
      // If password is sent empty, don't override the existing one
      if (!req.body.email.password) {
        settings.email.password = (await Setting.findById(settings._id)).email.password;
      }
    }
    if (req.body.sms) {
      settings.sms = { ...settings.sms, ...req.body.sms };
      if (!req.body.sms.twilioAuthToken) {
        settings.sms.twilioAuthToken = (await Setting.findById(settings._id)).sms.twilioAuthToken;
      }
    }
    if (req.body.notifications) {
      settings.notifications = { ...settings.notifications, ...req.body.notifications };
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// @desc    Get system settings
// @route   GET /api/system
// @access  Private
router.get('/system', protect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database offline' });
    const settings = await getSettingsDoc();
    res.json({ success: true, data: settings.system });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch system settings' });
  }
});

// @desc    Update system settings
// @route   PUT /api/system
// @access  Private/Admin
router.put('/system', protect, authorize('Admin'), async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database offline' });
    const settings = await getSettingsDoc();
    settings.system = { ...settings.system, ...req.body };
    await settings.save();
    res.json({ success: true, data: settings.system });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update system settings' });
  }
});

// @desc    Get security settings
// @route   GET /api/security
// @access  Private
router.get('/security', protect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database offline' });
    const settings = await getSettingsDoc();
    res.json({ success: true, data: settings.security });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch security settings' });
  }
});

// @desc    Update security settings
// @route   PUT /api/security
// @access  Private/Admin
router.put('/security', protect, authorize('Admin'), async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database offline' });
    const settings = await getSettingsDoc();
    settings.security = { ...settings.security, ...req.body };
    await settings.save();
    res.json({ success: true, data: settings.security });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update security settings' });
  }
});

// @desc    Test Email Configuration
// @route   POST /api/settings/test-email
// @access  Private/Admin
router.post('/test-email', protect, authorize('Admin'), async (req, res) => {
  try {
    const { toEmail } = req.body;
    const settings = await getSettingsDoc();
    
    // Resolve credentials (DB overrides env)
    const host = settings.email?.smtpHost || process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = settings.email?.smtpPort || process.env.SMTP_PORT || 587;
    const user = settings.email?.username || process.env.EMAIL_USER;
    const pass = settings.email?.password || process.env.EMAIL_PASS;
    const from = settings.email?.senderEmail || process.env.EMAIL_USER;
    
    if (!user || !pass) {
      return res.status(400).json({ success: false, error: 'SMTP credentials missing. Please configure them first.' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
      secure: port === 465
    });

    await transporter.sendMail({
      from: `"${settings.email?.senderName || 'Subhan Care'}" <${from}>`,
      to: toEmail || from,
      subject: 'Test Email - Subhan Care HMS Settings',
      html: `<h3>Test Email Successful</h3><p>Your SMTP configuration in Subhan Care HMS is working correctly.</p>`
    });

    res.json({ success: true, message: 'Test email sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Failed to send email: ${error.message}` });
  }
});

module.exports = router;
