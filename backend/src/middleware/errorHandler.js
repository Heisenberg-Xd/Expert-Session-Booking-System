// middleware/errorHandler.js - Custom error classes and global error middleware

/**
 * Base application error - all custom errors extend this.
 * Keeps error responses consistent and avoids leaking stack traces in production.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;            // Distinguish operational vs programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * ConflictError (409) - Used for race condition slot conflicts.
 * Frontend shows a specific "Slot already booked" message on this status code.
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Global error handler middleware.
 * Must be registered LAST in Express after all routes.
 */
const globalErrorHandler = (err, req, res, next) => {
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }

  // Handle MongoDB duplicate key errors (11000) - backup for transactions
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'This slot is already booked. Please choose another time.',
    });
  }

  // Handle our custom operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Programmer errors - don't leak details in production
  console.error('💥 UNEXPECTED ERROR:', err);
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred. Please try again.'
      : err.message,
  });
};

module.exports = { AppError, ValidationError, NotFoundError, ConflictError, globalErrorHandler };
