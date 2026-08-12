const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const LabTest = require('../models/LabTest');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../config/logger');

// Initialize memory store for lab tests if it doesn't exist
if (!global.memoryStore) global.memoryStore = {};
if (!global.memoryStore.labTests) global.memoryStore.labTests = [];

// Helper to check DB connection
const isDbConnected = () => mongoose.connection.readyState === 1;

// @route   GET /api/lab
// @desc    Get all lab tests
// @access  Private (Admin, Doctor, Receptionist, Staff)
router.get('/', protect, async (req, res) => {
  try {
    if (isDbConnected()) {
      const tests = await LabTest.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: tests.length, data: tests });
    } else {
      const tests = global.memoryStore.labTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ success: true, count: tests.length, data: tests, fallback: true });
    }
  } catch (error) {
    logger.error(`Error fetching lab tests: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/lab
// @desc    Create new lab test
// @access  Private (Admin, Doctor)
router.post('/', protect, authorize('Admin', 'Doctor'), async (req, res) => {
  try {
    const { patientId, patientName, doctorId, doctorName, testName, category, cost } = req.body;
    
    // Generate a unique ID: SC-LAB-XXXXX
    const testId = `SC-LAB-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const testData = {
      testId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      testName,
      category,
      cost: Number(cost),
      status: 'Pending',
      result: '',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDbConnected()) {
      const newTest = await LabTest.create(testData);
      logger.info(`Lab test created in MongoDB: ${testId}`);
      return res.status(201).json({ success: true, data: newTest });
    } else {
      global.memoryStore.labTests.push(testData);
      logger.info(`Lab test created in Memory Store: ${testId}`);
      return res.status(201).json({ success: true, data: testData, fallback: true });
    }
  } catch (error) {
    logger.error(`Error creating lab test: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/lab/:id
// @desc    Update lab test (status & result)
// @access  Private (Admin, Doctor, Staff)
router.put('/:id', protect, authorize('Admin', 'Doctor', 'Staff'), async (req, res) => {
  try {
    const { status, result } = req.body;
    
    if (isDbConnected()) {
      const test = await LabTest.findOne({ testId: req.params.id });
      if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
      
      if (status) test.status = status;
      if (result !== undefined) test.result = result;
      
      await test.save();
      logger.info(`Lab test updated in MongoDB: ${req.params.id}`);
      return res.json({ success: true, data: test });
    } else {
      const index = global.memoryStore.labTests.findIndex(t => t.testId === req.params.id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Lab test not found' });
      
      if (status) global.memoryStore.labTests[index].status = status;
      if (result !== undefined) global.memoryStore.labTests[index].result = result;
      global.memoryStore.labTests[index].updatedAt = new Date();
      
      logger.info(`Lab test updated in Memory Store: ${req.params.id}`);
      return res.json({ success: true, data: global.memoryStore.labTests[index], fallback: true });
    }
  } catch (error) {
    logger.error(`Error updating lab test: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/lab/:id
// @desc    Delete lab test
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    if (isDbConnected()) {
      const test = await LabTest.findOne({ testId: req.params.id });
      if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
      
      await test.remove();
      logger.info(`Lab test deleted from MongoDB: ${req.params.id}`);
      return res.json({ success: true, data: {} });
    } else {
      const index = global.memoryStore.labTests.findIndex(t => t.testId === req.params.id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Lab test not found' });
      
      global.memoryStore.labTests.splice(index, 1);
      logger.info(`Lab test deleted from Memory Store: ${req.params.id}`);
      return res.json({ success: true, data: {}, fallback: true });
    }
  } catch (error) {
    logger.error(`Error deleting lab test: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
