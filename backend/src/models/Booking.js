// models/Booking.js - Booking schema with status lifecycle
const mongoose = require('mongoose');

/**
 * Booking schema - represents a confirmed session between user and expert.
 *
 * Critical indexes:
 *   - Compound unique index on (expertId, bookingDate, timeSlot) prevents double-booking
 *     at the DB level as a final safety net (transactions are the primary guard).
 *   - userEmail index supports fast "my bookings" queries.
 */
const BookingSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true,
    index: true,
  },
  expertName: { type: String },           // Denormalized for fast reads (avoid joins)
  userName: { type: String, required: true, trim: true },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,                          // Fast lookup by email for MyBookings
  },
  userPhone: { type: String, required: true },
  bookingDate: { type: Date, required: true, index: true },
  timeSlot: { type: String, required: true },
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// CRITICAL: Unique compound index prevents double-booking at the DB layer.
// Transactions handle concurrent requests; this is the final guard.
BookingSchema.index(
  { expertId: 1, bookingDate: 1, timeSlot: 1 },
  { unique: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
