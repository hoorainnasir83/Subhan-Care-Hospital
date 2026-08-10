const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');
const logger = require('../config/logger');
const { protect, authorize } = require('../middleware/auth');
const { patientValidation, sanitizeQueryParams, handleValidationErrors } = require('../middleware/sanitization');
const { cacheMiddleware, clearCachePattern } = require('../config/cache');

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Get all patients
 *     description: Retrieve a list of all registered patients. Results are sorted by registration date (newest first).
 *     tags:
 *       - Patients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term for filtering patients by name or CNIC
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
 *         description: Patients retrieved successfully
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
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
router.get('/', protect, cacheMiddleware(300), sanitizeQueryParams, async (req, res) => {
  try {
    logger.info('Fetching patients', { userId: req.user._id || req.user.id });
    
    if (mongoose.connection.readyState === 1) {
      const patients = await Patient.find({}).sort({ registeredDate: -1 });
      logger.info('Patients fetched successfully', { count: patients.length });
      return res.json({ success: true, count: patients.length, data: patients });
    }
    const patients = global.memoryStore.patients;
    logger.info('Patients fetched from memory store', { count: patients.length });
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    logger.error('Error fetching patients', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id || req.user.id
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Register a new patient
 *     description: Create a new patient record. Requires Admin, Receptionist, or Staff role. CNIC must be unique and in format XXXXX-XXXXXXX-X.
 *     tags:
 *       - Patients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dob
 *               - gender
 *               - cnic
 *               - phone
 *               - email
 *               - bloodGroup
 *               - emergencyContact
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Ahmed Khan
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1985-06-15
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 example: Male
 *               cnic:
 *                 type: string
 *                 pattern: '^\d{5}-\d{7}-\d{1}$'
 *                 example: "12345-1234567-1"
 *               phone:
 *                 type: string
 *                 example: "03001234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ahmed@example.com
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                 example: O+
 *               emergencyContact:
 *                 type: string
 *                 example: "03009876543"
 *               address:
 *                 type: string
 *                 maxLength: 200
 *                 example: 123 Main Street, Karachi
 *               allergies:
 *                 type: string
 *                 example: Penicillin, Aspirin
 *               allergySeverity:
 *                 type: string
 *                 enum: [Critical, Moderate, Mild, None]
 *                 default: None
 *                 example: Moderate
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error or CNIC already registered
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       500:
 *         description: Server error
 */
// @desc    Register new patient
// @route   POST /api/patients
// @access  Private (Admin, Receptionist, Staff)
router.post('/', protect, authorize('Admin', 'Receptionist', 'Staff'), patientValidation, async (req, res) => {
  try {
    const { name, dob, gender, cnic, phone, email, bloodGroup, emergencyContact, address, allergies, allergySeverity } = req.body;

    // CNIC Regex Validation
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnic || !cnicRegex.test(cnic.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid CNIC format. Must be XXXXX-XXXXXXX-X (5-7-1 digits).' });
    }

    const formattedCnic = cnic.trim();
    const cleanEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanAllergies = allergies && allergies.trim() ? allergies.trim() : 'None';
    const validSeverities = ['Critical', 'Moderate', 'Mild', 'None'];
    const cleanSeverity = validSeverities.includes(allergySeverity) ? allergySeverity : 'None';

    if (mongoose.connection.readyState === 1) {
      // Prevent assigning an email to a patient that already belongs to a staff/admin user
      if (cleanEmail) {
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
          return res.status(400).json({ success: false, error: 'Email is already associated with a staff or admin account. Use a different email for patients.' });
        }
      }
      const duplicate = await Patient.findOne({ cnic: formattedCnic });
      if (duplicate) {
        return res.status(400).json({ success: false, error: `TC-01: A patient with CNIC "${formattedCnic}" is already registered.` });
      }

      const patients = await Patient.find({});
      let maxNum = 10000;
      patients.forEach(p => {
        const match = p.id.match(/SC-PAT-(\d+)/);
        if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
      });
      const patId = `SC-PAT-${maxNum + 1}`;

      const patient = await Patient.create({
        id: patId, name, dob, gender, cnic: formattedCnic, phone, email, bloodGroup, emergencyContact, address,
        allergies: cleanAllergies, allergySeverity: cleanSeverity,
        registeredDate: new Date().toISOString().split('T')[0]
      });

      return res.status(201).json({ success: true, data: patient });
    } else {
      const store = global.memoryStore;
      const cleanEmailMem = email && typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (cleanEmailMem) {
        const userConflict = store.users.find(u => u.email && u.email.toLowerCase() === cleanEmailMem);
        if (userConflict) {
          return res.status(400).json({ success: false, error: 'Email is already associated with a staff or admin account. Use a different email for patients.' });
        }
      }
      const duplicate = store.patients.find(p => p.cnic && p.cnic.trim() === formattedCnic);
      if (duplicate) {
        return res.status(400).json({ success: false, error: `TC-01: A patient with CNIC "${formattedCnic}" is already registered.` });
      }

      let maxNum = 10000;
      store.patients.forEach(p => {
        const match = p.id.match(/SC-PAT-(\d+)/);
        if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
      });
      const patId = `SC-PAT-${maxNum + 1}`;

      const dobDate = new Date(dob);
      const age = Math.floor((Date.now() - dobDate.getTime()) / (365.25 * 24 * 3600 * 1000));

      const newPatient = {
        id: patId, name, dob, age, gender, cnic: formattedCnic, phone, email, bloodGroup, emergencyContact, address,
        allergies: cleanAllergies, allergySeverity: cleanSeverity,
        registeredDate: new Date().toISOString().split('T')[0]
      };
      store.patients.unshift(newPatient);
      return res.status(201).json({ success: true, data: newPatient });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin, Staff)
router.delete('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const patient = await Patient.findOne({ id: req.params.id });
      if (!patient) return res.status(404).json({ success: false, error: 'Patient registry not found' });
      await Patient.deleteOne({ id: req.params.id });
      return res.json({ success: true, message: 'Patient removed successfully' });
    }
    const store = global.memoryStore;
    store.patients = store.patients.filter(p => p.id !== req.params.id);
    res.json({ success: true, message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
