// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookingsByEmail,
  updateBookingStatus,
  getBookingById,
} = require('../controllers/bookingController');
const { validateBooking } = require('../middleware/validator');

// POST /api/bookings - Create booking with transaction (race condition safe)
router.post('/', validateBooking, createBooking);

// GET /api/bookings?email=user@example.com&status=pending
router.get('/', getBookingsByEmail);

// GET /api/bookings/:id
router.get('/:id', getBookingById);

// PATCH /api/bookings/:id/status - Status lifecycle transitions
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
