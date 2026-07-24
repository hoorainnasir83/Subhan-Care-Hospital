require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Load in-memory fallback store into global scope immediately
require('./config/memoryStore');

// Connect to MongoDB (will fallback to in-memory store if unavailable)
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Root Status check (no DB required)
app.get('/', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'active',
    message: 'Subhan Care HMS REST API is running',
    db: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Running on In-Memory Store'
  });
});

// REST Routes (memory store fallback handled inside each route)
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
});
