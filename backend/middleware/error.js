const logger = require('../config/logger');

/**
 * Custom API Error class for throwing structured errors
 */
class ApiError extends Error {
  constructor(statusCode, message, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || 'UNKNOWN_ERROR';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error code mappings for standardized responses
 */
const ERROR_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * 404 Route handler — must be placed after all valid routes
 */
const notFound = (req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  const err = new ApiError(404, `Endpoint not found: ${req.originalUrl}`, 'NOT_FOUND');
  next(err);
};

/**
 * Centralized Express error handler
 * Normalizes all error types into a standardized JSON response.
 * Hides stack traces and internal details in production.
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || ERROR_CODES[statusCode] || 'UNKNOWN_ERROR';

  // ── Mongoose CastError (bad ObjectId) ─────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
    errorCode = 'INVALID_ID';
  }

  // ── Mongoose Duplicate Key (E11000) ───────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for "${field}". Please use another value.`;
    errorCode = 'DUPLICATE_ENTRY';
  }

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
    errorCode = 'TOKEN_EXPIRED';
  }

  // ── Multer / File Upload Errors ───────────────────────────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
    errorCode = 'FILE_UPLOAD_ERROR';
  }

  // ── Payload Too Large ─────────────────────────────────────────────────────
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload is too large';
    errorCode = 'PAYLOAD_TOO_LARGE';
  }

  // ── Syntax Error (bad JSON body) ──────────────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    errorCode = 'INVALID_JSON';
  }

  // ── Log the error ─────────────────────────────────────────────────────────
  const isServerError = statusCode >= 500;
  const logPayload = {
    statusCode,
    errorCode,
    message: err.message,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  };

  if (isServerError) {
    logPayload.stack = err.stack;
    logger.error('Server error', logPayload);
  } else {
    logger.warn('Client error', logPayload);
  }

  // ── Build the standardized response ───────────────────────────────────────
  const response = {
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Only include stack in development for non-operational errors
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { ApiError, errorHandler, notFound };
