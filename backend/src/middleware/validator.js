// middleware/validator.js - Request validation middleware
const { ValidationError } = require('./errorHandler');

/**
 * Validates POST /bookings request body.
 * Runs synchronously before the async controller to fail fast.
 */
const validateBooking = (req, res, next) => {
  const { expertId, userName, userEmail, userPhone, bookingDate, timeSlot } = req.body;

  if (!expertId) return next(new ValidationError('Expert ID is required'));
  if (!userName || userName.trim().length < 2)
    return next(new ValidationError('Name must be at least 2 characters'));
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))
    return next(new ValidationError('Valid email address is required'));
  if (!userPhone || !/^\d{10}$/.test(userPhone.replace(/[\s\-\+]/g, '')))
    return next(new ValidationError('Phone number must be 10 digits'));
  if (!bookingDate || isNaN(new Date(bookingDate)))
    return next(new ValidationError('Valid booking date is required'));
  if (new Date(bookingDate) < new Date(new Date().setHours(0, 0, 0, 0)))
    return next(new ValidationError('Booking date cannot be in the past'));
  if (!timeSlot)
    return next(new ValidationError('Time slot is required'));

  next();
};

/**
 * Validates PATCH /bookings/:id/status request.
 * Enforces the state machine: pending → confirmed → completed.
 */
const validateStatusTransition = (req, res, next) => {
  const { status, currentStatus } = req.body;
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!status) return next(new ValidationError('Status is required'));

  // currentStatus is passed from the controller after fetching the booking
  if (currentStatus && !validTransitions[currentStatus]?.includes(status)) {
    return next(new ValidationError(
      `Invalid status transition: ${currentStatus} → ${status}. ` +
      `Allowed: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
    ));
  }

  next();
};

module.exports = { validateBooking, validateStatusTransition };
