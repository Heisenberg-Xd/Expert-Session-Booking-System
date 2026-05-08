// models/Expert.js - Expert schema with availability slots
const mongoose = require('mongoose');

/**
 * Slot sub-schema: represents a single time block within a day.
 * isBooked uses optimistic locking via MongoDB transactions to prevent race conditions.
 */
const SlotSchema = new mongoose.Schema({
  time: { type: String, required: true },       // e.g., "09:00 AM"
  isBooked: { type: Boolean, default: false },
}, { _id: false });

/**
 * Availability sub-schema: groups slots by calendar date.
 */
const AvailabilitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  slots: [SlotSchema],
}, { _id: false });

/**
 * Expert schema - core entity of the booking system.
 * Indexed for common query patterns: category lookup, name search.
 */
const ExpertSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Business', 'Health', 'Education', 'Design'],
    index: true,                         // Fast category filtering
  },
  experience: { type: Number, required: true, min: 0 },
  rating: { type: Number, required: true, min: 0, max: 5, default: 4.5 },
  bio: { type: String, trim: true },
  profileImage: { type: String },         // URL to profile image
  hourlyRate: { type: Number, default: 100 },
  availability: [AvailabilitySchema],
  createdAt: { type: Date, default: Date.now },
});

// Text index for case-insensitive name search
ExpertSchema.index({ name: 'text' });
// Compound index for fast availability lookups
ExpertSchema.index({ 'availability.date': 1, category: 1 });

module.exports = mongoose.model('Expert', ExpertSchema);
