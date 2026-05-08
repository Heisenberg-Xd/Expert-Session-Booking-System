// middleware/errorHandler.js — Custom error classes + global Express handler
// Updated: Prisma error codes handled (P2002 duplicate, P2025 not found)

/**
 * Base operational error. All custom errors extend this.
 * isOperational = true means it's an expected error (show to user).
 * isOperational = false means programmer bug (don't leak in production).
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 400); this.name = 'ValidationError'; }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') { super(message, 404); this.name = 'NotFoundError'; }
}

/**
 * ConflictError (409) — returned when a slot is already booked.
 * Frontend checks for this status code to show the right message.
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') { super(message, 409); this.name = 'ConflictError'; }
}

/**
 * Global Express error handler — must be last middleware registered.
 * Handles both our custom errors AND Prisma-specific error codes.
 */
const globalErrorHandler = (err, req, res, next) => {
  // ── Prisma: unique constraint violation (race condition double-booking)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'This slot is already booked. Please choose another time.',
    });
  }

  // ── Prisma: record not found (findUniqueOrThrow / updateOrThrow)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: err.meta?.cause || 'Record not found.',
    });
  }

  // ── Prisma: invalid ID format or enum value
  if (err.code === 'P2023' || err.code === 'P2006') {
    return res.status(400).json({
      success: false,
      error: 'Invalid input format. Please check your request data.',
    });
  }

  // ── Our custom operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // ── Unknown programmer error — never leak details in production
  console.error('💥 UNEXPECTED ERROR:', err);
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred. Please try again.'
      : err.message,
  });
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  globalErrorHandler,
};
