const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../config/logger');
const { protect } = require('../middleware/auth');
const { sendResetCodeEmail } = require('../config/emailService');
const {
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  handleValidationErrors
} = require('../middleware/sanitization');

// Generate JWT token
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account in the system. Password must be at least 8 characters with uppercase, lowercase, and numbers.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123
 *                 description: Must contain uppercase, lowercase, and numbers
 *               role:
 *                 type: string
 *                 enum: [Admin, Doctor, Receptionist, Billing, Patient, Staff]
 *                 default: Staff
 *                 example: Patient
 *               doctorId:
 *                 type: string
 *                 format: mongodb
 *               patientId:
 *                 type: string
 *                 format: mongodb
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or email already registered
 *       500:
 *         description: Server error
 */
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, role, doctorId, patientId } = req.body;
    logger.info('User registration attempt', { email, role });

    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        logger.warn('Registration failed - Email already registered', { email });
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

      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        role: user.role
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
        logger.warn('Registration failed - Email already registered (memory store)', { email });
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

      logger.info('User registered successfully (memory store)', {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

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
    logger.error('Registration error', {
      email: req.body.email,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     description: Login with email and password to receive an authentication token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info('Login attempt', { email });

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        logger.warn('Login failed - Invalid credentials', { email });
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        logger.warn('Login failed - Invalid password', { email });
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      logger.info('User login successful', {
        userId: user._id,
        email: user.email,
        role: user.role
      });

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
        logger.warn('Login failed - Invalid credentials (memory store)', { email });
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        logger.warn('Login failed - Invalid password (memory store)', { email });
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      logger.info('User login successful (memory store)', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

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
    logger.error('Login error', {
      email: req.body.email,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile of the currently authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset code
 *     description: Send a password reset code to the user's email address. Code expires in 15 minutes.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Reset code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "✅ Reset code sent to your email"
 *                 expiresIn:
 *                   type: integer
 *                   example: 900
 *                   description: Expiration time in seconds
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// @desc    Forgot Password - Send Reset Code
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', [
  require('express-validator').body('email')
    .isEmail()
    .normalizeEmail()
    .toLowerCase()
    .withMessage('Please enter a valid email'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email } = req.body;
    logger.info('Password reset requested', { email });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('Password reset failed - User not found', { email });
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
      const store = global.memoryStore;
      const user = store.users.find(u => u.email === email);
      if (!user) {
        logger.warn('Password reset failed - User not found (memory store)', { email });
        return res.status(404).json({
          success: false,
          message: 'No account found with this email'
        });
      }
      user.resetCode = resetCode;
      user.resetCodeExpiry = resetCodeExpiry;
      user.failedAttempts = 0;
    }

    try {
      await sendResetCodeEmail(email, resetCode);
      logger.info('Password reset code sent', { email, expiresIn: 900 });
    } catch (emailError) {
      logger.error('Failed to send reset code email', {
        email,
        error: emailError.message
      });
    }

    res.json({
      success: true,
      message: '✅ Reset code sent to your email',
      expiresIn: 900
    });

  } catch (error) {
    logger.error('Password reset error', {
      email: req.body.email,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verify reset code and reset password
 *     description: Verify the reset code sent to email and set a new password. Accounts lock after 3 failed attempts.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^\d{6}$'
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewSecurePass123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewSecurePass123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "✅ Password reset successfully! Please login."
 *       400:
 *         description: Invalid or expired code, passwords don't match
 *       404:
 *         description: User not found
 *       429:
 *         description: Account locked due to too many failed attempts
 *       500:
 *         description: Server error
 */
// @desc    Verify Code & Reset Password
// @route   POST /api/auth/verify-code
// @access  Public
router.post('/verify-code', resetPasswordValidation, async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;
    logger.info('Password reset verification attempt', { email });

    if (newPassword !== confirmPassword) {
      logger.warn('Password reset failed - Passwords do not match', { email });
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select('+resetCode +resetCodeExpiry +failedAttempts +lockUntil +password');

      if (!user) {
        logger.warn('Password reset failed - User not found', { email });
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        logger.warn('Password reset attempted on locked account', { email });
        return res.status(429).json({ success: false, message: '🔒 Account locked. Try again in 10 minutes.' });
      }

      if (user.resetCode !== code) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
          logger.warn('Account locked due to too many failed password reset attempts', { email });
        }
        await user.save();
        logger.warn('Invalid password reset code', {
          email,
          attempts: user.failedAttempts
        });
        return res.status(400).json({
          success: false,
          message: `❌ Invalid code. ${Math.max(0, 3 - user.failedAttempts)} attempts remaining`
        });
      }

      if (user.resetCodeExpiry < new Date()) {
        logger.warn('Password reset code expired', { email });
        return res.status(400).json({ success: false, message: '⏰ Code expired. Request a new one.' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetCode = null;
      user.resetCodeExpiry = null;
      user.failedAttempts = 0;
      user.lockUntil = null;
      await user.save();

      logger.info('Password reset successfully completed', { email });

    } else {
      const store = global.memoryStore;
      const user = store.users.find(u => u.email === email);

      if (!user) {
        logger.warn('Password reset failed - User not found (memory store)', { email });
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        logger.warn('Password reset attempted on locked account (memory store)', { email });
        return res.status(429).json({ success: false, message: '🔒 Account locked. Try again in 10 minutes.' });
      }

      if (user.resetCode !== code) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
          logger.warn('Account locked due to too many failed password reset attempts (memory store)', { email });
        }
        logger.warn('Invalid password reset code (memory store)', {
          email,
          attempts: user.failedAttempts
        });
        return res.status(400).json({
          success: false,
          message: `❌ Invalid code. ${Math.max(0, 3 - user.failedAttempts)} attempts remaining`
        });
      }

      if (new Date(user.resetCodeExpiry) < new Date()) {
        logger.warn('Password reset code expired (memory store)', { email });
        return res.status(400).json({ success: false, message: '⏰ Code expired. Request a new one.' });
      }

      user.passwordHash = bcrypt.hashSync(newPassword, 10);
      user.resetCode = null;
      user.resetCodeExpiry = null;
      user.failedAttempts = 0;
      user.lockUntil = null;

      logger.info('Password reset successfully completed (memory store)', { email });
    }

    res.json({
      success: true,
      message: '✅ Password reset successfully! Please login.'
    });

  } catch (error) {
    logger.error('Password reset error', {
      email: req.body.email,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /auth/resend-code:
 *   post:
 *     summary: Resend password reset code
 *     description: Resend the password reset code to the user's email. Use this if the previous code expired or wasn't received.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: New reset code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "✅ New reset code sent!"
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// @desc    Resend Reset Code
// @route   POST /api/auth/resend-code
// @access  Public
router.post('/resend-code', [
  require('express-validator').body('email')
    .isEmail()
    .normalizeEmail()
    .toLowerCase()
    .withMessage('Please enter a valid email'),
  handleValidationErrors
], async (req, res) => {
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