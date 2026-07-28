const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2);
    }
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}${metaStr ? '\n' + metaStr : ''}`;
  })
);

// Create transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
    level: process.env.LOG_LEVEL || 'debug'
  }),

  // Error log file - logs all errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10
  }),

  // Combined log file - logs all levels
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    level: process.env.LOG_LEVEL || 'debug',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 20
  }),

  // Auth log file - logs authentication events
  new winston.transports.File({
    filename: path.join(logsDir, 'auth.log'),
    level: 'info',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    // Only log auth-related messages
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length > 0 ? JSON.stringify(meta) : ''}`;
      })
    )
  })
];

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: logFormat,
  defaultMeta: { service: 'subhan-care-hms' },
  transports: transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Log process startup info
logger.info('Logger initialized', {
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'debug',
  logsDirectory: logsDir
});

module.exports = logger;
