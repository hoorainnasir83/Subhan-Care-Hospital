const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// @route   GET /api/feedback
// @desc    Get all feedback (Admin) or doctor's feedback
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { doctorId } = req.query;
    let feedbacks = [];

    if (mongoose.connection.readyState === 1) {
      const filter = doctorId ? { doctorId } : {};
      feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
    } else {
      global.memoryStore.feedbacks = global.memoryStore.feedbacks || [];
      feedbacks = global.memoryStore.feedbacks
        .filter(f => !doctorId || f.doctorId === doctorId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, data: feedbacks });
  } catch (err) {
    logger.error('Failed to get feedback', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/feedback/doctor/:doctorId/stats
// @desc    Get average rating for a doctor
// @access  Private
router.get('/doctor/:doctorId/stats', protect, async (req, res) => {
  try {
    let feedbacks = [];

    if (mongoose.connection.readyState === 1) {
      feedbacks = await Feedback.find({ doctorId: req.params.doctorId });
    } else {
      global.memoryStore.feedbacks = global.memoryStore.feedbacks || [];
      feedbacks = global.memoryStore.feedbacks.filter(f => f.doctorId === req.params.doctorId);
    }

    const totalReviews = feedbacks.length;
    const avgRating = totalReviews > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(1)
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(f => { distribution[f.rating] = (distribution[f.rating] || 0) + 1; });

    res.json({ success: true, data: { avgRating: parseFloat(avgRating), totalReviews, distribution } });
  } catch (err) {
    logger.error('Failed to get doctor feedback stats', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/feedback
// @desc    Submit feedback for a doctor after appointment
// @access  Private (Patient)
router.post('/', protect, authorize('Patient', 'Admin'), async (req, res) => {
  try {
    const { doctorId, doctorName, appointmentId, rating, comment } = req.body;

    if (!doctorId || !rating) {
      return res.status(400).json({ success: false, error: 'Doctor and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const feedbackData = {
      patientId: req.user.patientId || req.user.id,
      patientName: req.user.name,
      doctorId,
      doctorName: doctorName || '',
      appointmentId: appointmentId || null,
      rating,
      comment: comment || '',
      createdAt: new Date()
    };

    let newFeedback;

    if (mongoose.connection.readyState === 1) {
      newFeedback = await Feedback.create(feedbackData);
    } else {
      global.memoryStore.feedbacks = global.memoryStore.feedbacks || [];
      feedbackData._id = 'fb-' + Date.now();
      global.memoryStore.feedbacks.push(feedbackData);
      newFeedback = feedbackData;
    }

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('feedback:new', newFeedback);
    }

    logger.info('New feedback submitted', { doctorId, rating });
    res.status(201).json({ success: true, data: newFeedback });
  } catch (err) {
    logger.error('Failed to submit feedback', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
