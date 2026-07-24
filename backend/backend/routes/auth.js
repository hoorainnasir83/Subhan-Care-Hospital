const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendResetCodeEmail } = require('../config/emailService');

// Generate JWT token
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, doctorId, patientId } = req.body;

    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User email is already registered' });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'Staff',
        doctorId: doctorId || null,
        patientId: patientId || null
      });

      return res.status(201).json({
        success: true,
        token: generateToken(user._id, user.email),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: user.doctorId,
          patientId: user.patientId
        }
      });
    } else {
      const store = global.memoryStore;
      const userExists = store.users.find(u => u.email === email);
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User email is already registered' });
      }

      const newUser = {
        id: `u-${Date.now()}`,
        name,
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        role: role || 'Staff',
        doctorId: doctorId || null,
        patientId: patientId || null
      };

      store.users.push(newUser);

      return res.status(201).json({
        success: true,
        token: generateToken(newUser.id, newUser.email),
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          doctorId: newUser.doctorId,
          patientId: newUser.patientId
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      return res.json({
        success: true,
        token: generateToken(user._id, user.email),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: user.doctorId,
          patientId: user.patientId
        }
      });
    } else {
      const store = global.memoryStore;
      const user = store.users.find(u => u.email === email);
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      return res.json({
        success: true,
        token: generateToken(user.id, user.email),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: user.doctorId,
          patientId: user.patientId
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        doctorId: req.user.doctorId,
        patientId: req.user.patientId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Forgot Password - Send Reset Code
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email'
        });
      }

      user.resetCode = resetCode;
      user.resetCodeExpiry = resetCodeExpiry;
      user.failedAttempts = 0;
      await user.save();
    } else {
      // Memory Store Fallback
      const store = global.memoryStore;
      const user = store.users.find(u => u.email === email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email'
        });
      }
      user.resetCode = resetCode;
      user.resetCodeExpiry = resetCodeExpiry;
      user.failedAttempts = 0;
    }

    // Send email
    await sendResetCodeEmail(email, resetCode);

    res.json({
      success: true,
      message: '✅ Reset code sent to your email',
      expiresIn: 900
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Verify Code & Reset Password
// @route   POST /api/auth/verify-code
// @access  Public
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select('+resetCode +resetCodeExpiry +failedAttempts +lockUntil +password');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        return res.status(429).json({ success: false, message: '🔒 Account locked. Try again in 10 minutes.' });
      }

      if (user.resetCode !== code) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
        }
        await user.save();
        return res.status(400).json({
          success: false,
          message: `❌ Invalid code. ${Math.max(0, 3 - user.failedAttempts)} attempts remaining`
        });
      }

      if (user.resetCodeExpiry < new Date()) {
        return res.status(400).json({ success: false, message: '⏰ Code expired. Request a new one.' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetCode = null;
      user.resetCodeExpiry = null;
      user.failedAttempts = 0;
      user.lockUntil = null;
      await user.save();

    } else {
      // Memory Store Fallback
      const store = global.memoryStore;
      const user = store.users.find(u => u.email === email);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        return res.status(429).json({ success: false, message: '🔒 Account locked. Try again in 10 minutes.' });
      }

      if (user.resetCode !== code) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
        }
        return res.status(400).json({
          success: false,
          message: `❌ Invalid code. ${Math.max(0, 3 - user.failedAttempts)} attempts remaining`
        });
      }

      if (new Date(user.resetCodeExpiry) < new Date()) {
        return res.status(400).json({ success: false, message: '⏰ Code expired. Request a new one.' });
      }

      user.passwordHash = bcrypt.hashSync(newPassword, 10);
      user.resetCode = null;
      user.resetCodeExpiry = null;
      user.failedAttempts = 0;
      user.lockUntil = null;
    }

    res.json({
      success: true,
      message: '✅ Password reset successfully! Please login.'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Resend Reset Code
// @route   POST /api/auth/resend-code
// @access  Public
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.resetCode = resetCode;
      user.resetCodeExpiry = resetCodeExpiry;
      await user.save();
    } else {
      const store = global.memoryStore;
      const user = store.users.find(u => u.email === email);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.resetCode = resetCode;
      user.resetCodeExpiry = resetCodeExpiry;
    }

    await sendResetCodeEmail(email, resetCode);

    res.json({
      success: true,
      message: '✅ New reset code sent!'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;