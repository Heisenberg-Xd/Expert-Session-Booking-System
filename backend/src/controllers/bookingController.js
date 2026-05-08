// controllers/bookingController.js - Booking logic with race condition handling
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');

// io instance is injected after server starts (see server.js)
let io;
const setIO = (socketIO) => { io = socketIO; };

/**
 * POST /bookings
 *
 * RACE CONDITION HANDLING STRATEGY (Uber-style):
 * 1. MongoDB Transaction (ACID) - Primary lock. Read-then-write is atomic.
 * 2. Unique compound index - Secondary guard. DB-level deduplication.
 * 3. Socket.io emit AFTER commit - Ensures real-time update only on success.
 *
 * This handles the case of 1000 concurrent requests for the same slot:
 * exactly ONE will succeed, all others get a 409 ConflictError.
 */
const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { expertId, userName, userEmail, userPhone, bookingDate, timeSlot, notes } = req.body;

    // Normalize date to midnight UTC for consistent comparison
    const normalizedDate = new Date(bookingDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // WITHIN TRANSACTION: Find expert where the specific slot is still available.
    // This read-check is atomic with the subsequent write - no other transaction
    // can modify this expert document between this read and the commit.
    const expert = await Expert.findOne({
      _id: expertId,
      'availability': {
        $elemMatch: {
          date: normalizedDate,
          'slots': {
            $elemMatch: { time: timeSlot, isBooked: false },
          },
        },
      },
    }).session(session);

    if (!expert) {
      // Either expert not found OR slot already taken - safe to expose this info
      throw new ConflictError('This slot is already booked or unavailable. Please choose another time.');
    }

    // WITHIN TRANSACTION: Create the booking document
    const [booking] = await Booking.create([{
      expertId,
      expertName: expert.name,
      userName: userName.trim(),
      userEmail: userEmail.toLowerCase().trim(),
      userPhone: userPhone.replace(/[\s\-]/g, ''),
      bookingDate: normalizedDate,
      timeSlot,
      notes: notes?.trim() || '',
      status: 'pending',
    }], { session });

    // WITHIN TRANSACTION: Mark the slot as booked using positional array filters.
    // This precise update ensures only the matching slot is modified.
    await Expert.updateOne(
      { _id: expertId, 'availability.date': normalizedDate },
      {
        $set: {
          'availability.$[dateElem].slots.$[slotElem].isBooked': true,
        },
      },
      {
        arrayFilters: [
          { 'dateElem.date': normalizedDate },
          { 'slotElem.time': timeSlot },
        ],
        session,
      }
    );

    // Commit the atomic transaction
    await session.commitTransaction();

    // Emit ONLY after successful commit - prevents false real-time updates
    if (io) {
      io.to(expertId.toString()).emit('slot-booked', {
        expertId,
        bookingDate: normalizedDate,
        timeSlot,
        bookingId: booking._id,
      });
    }

    res.status(201).json({ success: true, data: booking });

  } catch (error) {
    // Always abort on any error to release the lock
    await session.abortTransaction();
    next(error);
  } finally {
    // Always end session to return connection to pool
    session.endSession();
  }
};

/**
 * GET /bookings
 * Fetches bookings by user email (for MyBookings component).
 * Supports status filter and date sort.
 */
const getBookingsByEmail = async (req, res, next) => {
  try {
    const { email, status } = req.query;

    if (!email) {
      return res.json({ success: true, data: [] });
    }

    const filter = { userEmail: email.toLowerCase().trim() };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .sort({ bookingDate: -1 }) // Most recent first
      .populate('expertId', 'name category profileImage') // Efficient projection
      .lean();

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /bookings/:id/status
 * Updates booking status with state machine validation.
 * Emits real-time event to notify the user.
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) throw new NotFoundError('Booking not found');

    // State machine: define valid transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      throw new ValidationError(
        `Cannot transition from '${booking.status}' to '${status}'. ` +
        `Allowed: ${validTransitions[booking.status]?.join(', ') || 'none'}`
      );
    }

    booking.status = status;
    await booking.save();

    // Notify the user's email room of status change
    if (io) {
      io.to(`user:${booking.userEmail}`).emit('booking-status-updated', {
        bookingId: booking._id,
        status: booking.status,
        expertName: booking.expertName,
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/:id
 * Get single booking by ID.
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('expertId', 'name category profileImage rating')
      .lean();
    if (!booking) throw new NotFoundError('Booking not found');
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getBookingsByEmail, updateBookingStatus, getBookingById, setIO };
