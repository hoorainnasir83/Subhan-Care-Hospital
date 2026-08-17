require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const connectDB = require('./config/db');
const logger = require('./config/logger');

// Load in-memory fallback store into global scope immediately
require('./config/memoryStore');

// Initialize Cron Jobs
require('./jobs/reminderCron');

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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// ✅ Security Headers Middleware (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// ✅ NoSQL Injection Prevention Middleware (mongoSanitize)
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('NoSQL injection attempt detected', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      field: key
    });
  }
}));

// ✅ Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

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

// ✅ Swagger/OpenAPI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  swaggerOptions: {
    persistAuthorization: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: 'list'
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Subhan Care HMS API Docs'
}));

// REST Routes
// ✅ Auth routes with stricter rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/resend-code', forgotPasswordLimiter);

// ✅ Audit Logger Middleware (tracks all mutations)
const auditLogger = require('./middleware/auditLogger');

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/patients',     auditLogger('patients'), require('./routes/patients'));
app.use('/api/doctors',      auditLogger('doctors'), require('./routes/doctors'));
app.use('/api/staff',        auditLogger('staff'), require('./routes/staff'));
app.use('/api/appointments', auditLogger('appointments'), require('./routes/appointments'));
app.use('/api/invoices',     auditLogger('invoices'), require('./routes/invoices'));
app.use('/api/payments',     auditLogger('payments'), require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search',       require('./routes/search'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/inventory',    auditLogger('inventory'), require('./routes/inventory'));
app.use('/api/medical-records',  auditLogger('medical-records'), require('./routes/medicalRecords'));
app.use('/api/prescriptions',    auditLogger('prescriptions'), require('./routes/prescriptions'));
app.use('/api/lab',              auditLogger('lab'), require('./routes/lab'));
app.use('/api/settings',         auditLogger('settings'), require('./routes/settings'));
app.use('/api/audit-logs',       require('./routes/auditLogs'));
app.use('/api/feedback',         auditLogger('feedback'), require('./routes/feedback'));
app.use('/api/system',           (req, res, next) => { req.url = '/system' + (req.url === '/' ? '' : req.url); next(); }, require('./routes/settings'));
app.use('/api/security',         (req, res, next) => { req.url = '/security' + (req.url === '/' ? '' : req.url); next(); }, require('./routes/settings'));

// ✅ Centralized Error Handling Middleware
const { notFound, errorHandler } = require('./middleware/error');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  logger.info('Socket.io client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('Socket.io client disconnected', { socketId: socket.id });
  });
});

app.set('io', io);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`✅ Server running on port ${PORT}`);
    logger.info(`🛡️  Rate limiting enabled`);
    logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;