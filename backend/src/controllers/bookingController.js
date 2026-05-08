// controllers/bookingController.js — Prisma transaction-based booking
const prisma = require('../lib/prisma');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');

// io injected after server boots — same pattern as before
let io;
const setIO = (socketIO) => { io = socketIO; };

/**
 * POST /api/bookings
 *
 * RACE CONDITION STRATEGY (PostgreSQL edition):
 * ─────────────────────────────────────────────
 * 1. prisma.$transaction([...]) — serialisable-isolation block
 *    Prisma wraps all operations in a DB transaction. PostgreSQL's
 *    row-level locking ensures only ONE writer can update a slot row.
 *
 * 2. findFirst inside transaction checks isBooked === false.
 *    If two concurrent requests both see isBooked=false, PostgreSQL's
 *    MVCC ensures only one UPDATE wins; the other hits the unique
 *    constraint on Booking.slotId and gets a P2002 error.
 *
 * 3. @@unique([expertId, date, timeSlot]) on AvailabilitySlot +
 *    @unique slotId on Booking = dual DB-level safety net.
 */
const createBooking = async (req, res, next) => {
  try {
    const { expertId, userName, userEmail, userPhone, bookingDate, timeSlot, notes } = req.body;

    // Normalise date to midnight UTC
    const normalizedDate = new Date(bookingDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // Run all DB operations atomically
    const booking = await prisma.$transaction(async (tx) => {

      // 1. Find the slot and confirm it exists and is NOT already booked
      const slot = await tx.availabilitySlot.findFirst({
        where: {
          expertId,
          date:     normalizedDate,
          timeSlot,
          isBooked: false,          // CRITICAL: must be free
        },
        include: { expert: { select: { name: true } } },
      });

      if (!slot) {
        throw new ConflictError(
          'This slot is already booked or unavailable. Please choose another time.'
        );
      }

      // 2. Mark slot as booked (row-level lock — concurrent tx waits here)
      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data:  { isBooked: true },
      });

      // 3. Create the booking record linked to this slot
      const newBooking = await tx.booking.create({
        data: {
          expertId,
          expertName:  slot.expert.name,
          slotId:      slot.id,
          userName:    userName.trim(),
          userEmail:   userEmail.toLowerCase().trim(),
          userPhone:   userPhone.replace(/[\s\-]/g, ''),
          bookingDate: normalizedDate,
          timeSlot,
          notes:       notes?.trim() ?? '',
          status:      'PENDING',
        },
      });

      return newBooking;
    }); // ← transaction commits here atomically

    // Emit ONLY after successful commit — no false real-time signals
    if (io) {
      io.to(expertId).emit('slot-booked', {
        expertId,
        bookingDate: normalizedDate,
        timeSlot,
        bookingId: booking.id,
      });
    }

    res.status(201).json({
      success: true,
      data: formatBooking(booking),
    });

  } catch (error) {
    // Prisma unique constraint violation — slot was just taken (race condition)
    if (error.code === 'P2002') {
      return next(new ConflictError(
        'This slot is already booked. Please choose another time.'
      ));
    }
    next(error);
  }
};

/**
 * GET /api/bookings
 * Fetch bookings by user email. Optional status filter.
 */
const getBookingsByEmail = async (req, res, next) => {
  try {
    const { email, status } = req.query;

    if (!email) return res.json({ success: true, data: [] });

    const where = {
      userEmail: email.toLowerCase().trim(),
    };

    // Validate status against enum
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (status && validStatuses.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
      include: {
        expert: {
          select: {
            id:           true,
            name:         true,
            category:     true,
            profileImage: true,
            rating:       true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: bookings.map(formatBooking),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        expert: {
          select: { id: true, name: true, category: true, profileImage: true, rating: true },
        },
      },
    });

    if (!booking) throw new NotFoundError('Booking not found');

    res.json({ success: true, data: formatBooking(booking) });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/bookings/:id/status
 * State machine: PENDING → CONFIRMED → COMPLETED (or any → CANCELLED)
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const newStatus = status?.toUpperCase();

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) throw new NotFoundError('Booking not found');

    // Enforce state machine transitions
    const validTransitions = {
      PENDING:   ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[booking.status]?.includes(newStatus)) {
      throw new ValidationError(
        `Invalid transition: ${booking.status} → ${newStatus}. ` +
        `Allowed: ${validTransitions[booking.status]?.join(', ') || 'none'}`
      );
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: newStatus },
    });

    // Real-time notification to the user's email room
    if (io) {
      io.to(`user:${booking.userEmail}`).emit('booking-status-updated', {
        bookingId:  booking.id,
        status:     newStatus,
        expertName: booking.expertName,
      });
    }

    res.json({ success: true, data: formatBooking(updated) });
  } catch (error) {
    next(error);
  }
};

/**
 * Normalise Prisma booking shape → frontend-compatible shape.
 *
 * Prisma returns:  { id, expertId (string), expert (object), status (ENUM), ... }
 * Frontend expects: { id, expertId (object with .name/.category), status (lowercase), ... }
 *
 * We keep expertId as the nested expert object for MyBookings to read
 * booking.expertId?.name — matching the old Mongoose populate() behaviour.
 * The raw string expert FK is exposed as expertIdRaw if ever needed.
 */
const formatBooking = (b) => {
  const { expert, ...rest } = b;
  return {
    ...rest,
    status:   rest.status?.toLowerCase(),
    // Replace the scalar expertId string with the populated expert object
    // so MyBookings.jsx `booking.expertId?.name` continues to work unchanged.
    expertId: expert ?? rest.expertId,
  };
};

module.exports = {
  createBooking,
  getBookingsByEmail,
  getBookingById,
  updateBookingStatus,
  setIO,
};
