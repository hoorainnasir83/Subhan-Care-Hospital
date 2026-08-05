const { body, query, param, sanitize, validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * SANITIZATION UTILITIES
 * Comprehensive input validation and sanitization middleware for Subhan Care HMS
 */

// ─── Validation Error Handler ────────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const errorMsg = firstError.msg;
    logger.warn('Validation failure', {
      url: req.url,
      method: req.method,
      param: firstError.param || firstError.path,
      error: errorMsg,
      errors: errors.array()
    });
    return res.status(400).json({
      success: false,
      error: errorMsg,
      details: errors.array().map(e => ({ field: e.path || e.param, message: e.msg }))
    });
  }
  next();
};

// ─── String Sanitizers ───────────────────────────────────────────────────────
const sanitizeString = (field) => {
  return body(field)
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`${field} cannot be empty`);
};

const sanitizeEmail = (field = 'email') => {
  return body(field)
    .trim()
    .isEmail()
    .normalizeEmail()
    .toLowerCase()
    .withMessage('Please enter a valid email address');
};

const sanitizePassword = (field = 'password', minLength = 6) => {
  return body(field)
    .trim()
    .isLength({ min: minLength })
    .withMessage(`Password must be at least ${minLength} characters`);
};

const sanitizeOptionalString = (field) => {
  return body(field)
    .optional()
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`${field} cannot be empty if provided`);
};

// ─── Numeric Sanitizers ──────────────────────────────────────────────────────
const sanitizeNumber = (field) => {
  return body(field)
    .trim()
    .isInt()
    .withMessage(`${field} must be a number`);
};

const sanitizePhone = (field = 'phone') => {
  return body(field)
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format')
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone number must be between 7 and 20 characters');
};

// ─── ID Sanitizers ──────────────────────────────────────────────────────────
const sanitizeMongoId = (field = 'id') => {
  return param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`);
};

const sanitizeObjectId = (field = '_id') => {
  return body(field)
    .optional()
    .isMongoId()
    .withMessage(`Invalid ${field} format`);
};

// ─── Enum/Role Sanitizers ───────────────────────────────────────────────────
const sanitizeRole = (field = 'role') => {
  const validRoles = ['Admin', 'Doctor', 'Receptionist', 'Billing', 'Patient', 'Staff'];
  return body(field)
    .optional()
    .trim()
    .isIn(validRoles)
    .withMessage(`Role must be one of: ${validRoles.join(', ')}`);
};

const sanitizeStatus = (field = 'status', validStatuses = ['active', 'inactive']) => {
  return body(field)
    .optional()
    .trim()
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(', ')}`);
};

// ─── Date Sanitizers ────────────────────────────────────────────────────────
const sanitizeDate = (field = 'date') => {
  return body(field)
    .trim()
    .isISO8601()
    .withMessage(`${field} must be a valid date (YYYY-MM-DD)`);
};

// ─── Validation Schemas ──────────────────────────────────────────────────────

// User Registration Validation
const registerValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  sanitizeEmail('email'),
  
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain lowercase, uppercase, and numbers'),
  
  sanitizeRole('role'),
  
  body('doctorId').optional().trim().escape(),
  body('patientId').optional().trim().escape(),
  
  handleValidationErrors
];

// Login Validation
const loginValidation = [
  sanitizeEmail('email'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Password Reset Validation
const resetPasswordValidation = [
  sanitizeEmail('email'),
  body('code').trim().matches(/^\d{6}$/).withMessage('Reset code must be 6 digits'),
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain lowercase, uppercase, and numbers'),
  body('confirmPassword').trim().notEmpty().withMessage('Confirm password is required'),
  handleValidationErrors
];

// Patient Validation
const patientValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Patient name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Patient name must be between 2 and 100 characters'),
  
  sanitizeEmail('email'),
  
  body('phone')
    .trim()
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number'),
  
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().trim().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('bloodGroup').optional().trim().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('address').optional().trim().escape().isLength({ max: 200 }).withMessage('Address must be less than 200 characters'),
  body('allergies').optional(),
  body('emergencyContact').optional().trim().escape(),
  body('emergencyContactPhone').optional().trim().matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid emergency contact phone'),
  
  handleValidationErrors
];

// Doctor Validation
const doctorValidation = [
  body('name').trim().escape().notEmpty().withMessage('Doctor name is required'),
  sanitizeEmail('email'),
  body('phone').optional().trim().matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number'),
  body('specialization').optional().trim().escape(),
  body('qualification').optional().trim().escape(),
  body('experience').optional().isInt({ min: 0, max: 70 }).withMessage('Experience must be between 0 and 70 years'),
  body('licenseNumber').optional().trim().escape(),
  
  handleValidationErrors
];

// Appointment Validation
const appointmentValidation = [
  body('doctorId').trim().notEmpty().withMessage('Doctor ID is required'),
  body('patientId').optional().trim(),
  body('patientName').optional().trim().escape(),
  body('appointmentDate').optional().isISO8601().withMessage('Invalid appointment date format'),
  body('appointmentTime').optional().trim().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('reason').trim().escape().optional(),
  body('notes').trim().escape().optional(),
  body('status').optional().trim().isIn(['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Scheduled']).withMessage('Invalid appointment status'),
  
  handleValidationErrors
];

// Medicine / Inventory Validation
const medicineValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Medicine name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Medicine name must be between 2 and 150 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'])
    .withMessage('Invalid category'),

  body('expiryDate').isISO8601().withMessage('Expiry date must be a valid date (YYYY-MM-DD)'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a non-negative number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
  body('unit').optional().trim().isIn(['Tablets', 'Capsules', 'ml', 'mg', 'Units', 'Strips', 'Vials', 'Bottles']).withMessage('Invalid unit'),
  body('genericName').optional().trim().escape(),
  body('manufacturer').optional().trim().escape(),
  body('batchNumber').optional().trim().escape(),
  body('location').optional().trim().escape(),
  body('description').optional().trim().escape().isLength({ max: 500 }).withMessage('Description too long'),

  handleValidationErrors
];

// Invoice Validation
const invoiceValidation = [
  body('patientId').trim().notEmpty().withMessage('Patient ID is required'),
  body('description').trim().escape().optional(),
  body('services').optional().isArray().withMessage('Services must be an array'),
  body('status').optional().trim().isIn(['Pending', 'Paid', 'Unpaid', 'Overdue', 'Cancelled']).withMessage('Invalid invoice status'),
  
  handleValidationErrors
];

// Query Parameter Sanitization
const sanitizeQueryParams = [
  query('search')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),
  
  query('q')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive number'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .trim()
    .escape(),
  
  handleValidationErrors
];

module.exports = {
  // Error handler
  handleValidationErrors,
  
  // Sanitizers
  sanitizeString,
  sanitizeEmail,
  sanitizePassword,
  sanitizeOptionalString,
  sanitizeNumber,
  sanitizePhone,
  sanitizeMongoId,
  sanitizeObjectId,
  sanitizeRole,
  sanitizeStatus,
  sanitizeDate,
  
  // Validation schemas
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  patientValidation,
  doctorValidation,
  appointmentValidation,
  invoiceValidation,
  medicineValidation,
  sanitizeQueryParams
};
