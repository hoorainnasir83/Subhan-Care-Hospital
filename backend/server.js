require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load in-memory fallback store into global scope immediately
require('./config/memoryStore');

// Connect to MongoDB (will fallback to in-memory store if unavailable)
connectDB();

const app = express();

// ✅ Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 forgot password requests per hour
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Apply Global Rate Limiter
app.use(globalLimiter);

// Root Status check (no DB required)
app.get('/', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'active',
    message: 'Subhan Care HMS REST API is running',
    db: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Running on In-Memory Store'
  });
});

// REST Routes
// ✅ Auth routes with stricter rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/resend-code', forgotPasswordLimiter);
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/patients',     require('./routes/patients'));
app.use('/api/doctors',      require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/invoices',     require('./routes/invoices'));

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🛡️  Rate limiting enabled`);
});