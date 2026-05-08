// routes/bookingRoutes.js — unchanged route paths (frontend contract preserved)
const express = require('express');
const router  = express.Router();
const {
  createBooking,
  getBookingsByEmail,
  getBookingById,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { validateBooking } = require('../middleware/validator');

// POST /api/bookings — create with transaction-safe race condition handling
router.post('/', validateBooking, createBooking);

// GET /api/bookings?email=user@example.com&status=pending
router.get('/', getBookingsByEmail);

// GET /api/bookings/:id
router.get('/:id', getBookingById);

// PATCH /api/bookings/:id/status — state machine transition
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
