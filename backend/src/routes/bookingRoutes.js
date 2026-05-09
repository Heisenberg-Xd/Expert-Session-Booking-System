// routes/bookingRoutes.js — token-based secure routes
const express = require('express');
const router  = express.Router();
const {
  createBooking,
  getBookingByToken,
  getBookingById,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { validateBooking } = require('../middleware/validator');

// POST /api/bookings — create with transaction-safe race condition handling
router.post('/', validateBooking, createBooking);

// GET /api/bookings/manage/:token
router.get('/manage/:token', getBookingByToken);

// GET /api/bookings/:id
router.get('/:id', getBookingById);

// PATCH /api/bookings/manage/:token/status — secure state machine transition
router.patch('/manage/:token/status', updateBookingStatus);

module.exports = router;
