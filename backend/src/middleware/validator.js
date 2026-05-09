// middleware/validator.js — Request validation middleware (Prisma-compatible)
// ObjectId checks removed; CUID strings have no format constraint to validate.
const { ValidationError } = require('./errorHandler');

/**
 * Validates POST /bookings body.
 * Runs before the controller so failures are fast and cheap.
 */
const validateBooking = (req, res, next) => {
  const { expertId, userName, userEmail, userPhone, bookingDate, timeSlot } = req.body;

  if (!expertId || typeof expertId !== 'string' || expertId.trim().length < 5)
    return next(new ValidationError('Valid Expert ID is required'));

  if (!userName || userName.trim().length < 2)
    return next(new ValidationError('Name must be at least 2 characters'));

  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))
    return next(new ValidationError('Valid email address is required'));

  if (!userPhone || !/^\d{10}$/.test(userPhone.replace(/[\s\-\+]/g, '')))
    return next(new ValidationError('Phone number must be 10 digits'));

  if (!bookingDate || isNaN(new Date(bookingDate)))
    return next(new ValidationError('Valid booking date is required'));

  // Past-date check — use UTC midnight on both sides to avoid timezone drift
  const [y, m, d] = bookingDate.split('T')[0].split('-').map(Number);
  const bookDateUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  if (bookDateUTC < todayUTC)
    return next(new ValidationError('Booking date cannot be in the past'));

  if (!timeSlot || typeof timeSlot !== 'string' || timeSlot.trim().length === 0)
    return next(new ValidationError('Time slot is required'));

  next();
};

module.exports = { validateBooking };
