const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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
      // Memory Store Fallback
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
      // Memory Store Fallback
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

module.exports = router;
