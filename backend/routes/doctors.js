const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const logger = require('../config/logger');
const { protect, authorize } = require('../middleware/auth');
const { doctorValidation, sanitizeQueryParams, handleValidationErrors } = require('../middleware/sanitization');
const { cacheMiddleware, clearCachePattern } = require('../config/cache');

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get all doctors
 *     description: Retrieve a list of all doctors in the system with their details and ratings.
 *     tags:
 *       - Doctors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term for filtering doctors by name or specialization
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
 *         description: Doctors retrieved successfully
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
 *                   example: 8
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Doctor'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
router.get('/', protect, cacheMiddleware(300), sanitizeQueryParams, async (req, res) => {
  try {
    logger.info('Fetching doctors', { userId: req.user._id || req.user.id });
    
    if (mongoose.connection.readyState === 1) {
      const doctors = await Doctor.find({});
      logger.info('Doctors fetched successfully', { count: doctors.length });
      return res.json({ success: true, count: doctors.length, data: doctors });
    }
    logger.info('Doctors fetched from memory store', { count: global.memoryStore.doctors.length });
    res.json({ success: true, count: global.memoryStore.doctors.length, data: global.memoryStore.doctors });
  } catch (error) {
    logger.error('Error fetching doctors', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id || req.user.id
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Register a new doctor
 *     description: Add a new doctor to the system. Requires Admin or Staff role.
 *     tags:
 *       - Doctors
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
 *               - specialty
 *               - phone
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Dr. Ali Hassan
 *               specialty:
 *                 type: string
 *                 maxLength: 100
 *                 example: Cardiology
 *               phone:
 *                 type: string
 *                 example: "03001234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dr.ali@hospital.com
 *               availability:
 *                 type: string
 *                 example: "Monday-Friday 9AM-5PM"
 *               fee:
 *                 type: number
 *                 minimum: 0
 *                 example: 2000
 *     responses:
 *       201:
 *         description: Doctor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       500:
 *         description: Server error
 */
// @desc    Recruit a new doctor
// @route   POST /api/doctors
// @access  Private (Admin, Staff)
router.post('/', protect, authorize('Admin', 'Staff'), doctorValidation, async (req, res) => {
  try {
    const { name, specialty, phone, email, availability, fee } = req.body;
    const docId = `doc-${Date.now()}`;

    if (mongoose.connection.readyState === 1) {
      const doctor = await Doctor.create({ id: docId, name, specialty, phone, email, availability, fee: Number(fee) || 100, rating: 5.0, consultsCount: 0 });
      return res.status(201).json({ success: true, data: doctor });
    }

    const newDoc = { id: docId, name, specialty, phone, email, availability, fee: Number(fee) || 100, rating: 5.0, consultsCount: 0 };
    global.memoryStore.doctors.unshift(newDoc);
    res.status(201).json({ success: true, data: newDoc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /doctors/{id}:
 *   delete:
 *     summary: Remove a doctor from staff
 *     description: Remove a doctor record from the system. Requires Admin or Staff role.
 *     tags:
 *       - Doctors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID to remove
 *     responses:
 *       200:
 *         description: Doctor removed successfully
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
 *                   example: "Doctor roster record removed"
 *       401:
 *         description: Unauthorized or insufficient permissions
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
// @desc    Remove a doctor from staff
// @route   DELETE /api/doctors/:id
// @access  Private (Admin, Staff)
router.delete('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const doctor = await Doctor.findOne({ id: req.params.id });
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found in roster' });
      await Doctor.deleteOne({ id: req.params.id });
      clearCachePattern('/api/doctors*');
      return res.json({ success: true, message: 'Doctor roster record removed' });
    }
    global.memoryStore.doctors = global.memoryStore.doctors.filter(d => d.id !== req.params.id);
    clearCachePattern('/api/doctors*');
    res.json({ success: true, message: 'Doctor roster record removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
