// 📅 Booking Controller handles session scheduling and transactional atomicity.
// Implements Prisma transactions to prevent race conditions during concurrent bookings.
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

    // ─── DEBUG LOGGING ─────────────────────────────────────────────────────────
    console.log('\n📋 BOOKING REQUEST RECEIVED:');
    console.log('  expertId    :', expertId);
    console.log('  bookingDate :', bookingDate, '(raw from frontend)');
    console.log('  timeSlot    :', JSON.stringify(timeSlot), '(raw)');
    console.log('  userName    :', userName);
    console.log('  userEmail   :', userEmail);
    // ───────────────────────────────────────────────────────────────────────────

    // CRITICAL FIX: Parse date string as explicit UTC midnight.
    // Using `new Date(dateString)` where dateString is "YYYY-MM-DD" always
    // resolves to midnight UTC per the ISO 8601 spec — this is correct.
    // The old approach: new Date(bookingDate).setHours(0,0,0,0) was dangerous
    // because setHours() operates in LOCAL server timezone, causing a mismatch
    // vs. the DB which stores seed slots at midnight UTC.
    const [year, month, day] = bookingDate.split('T')[0].split('-').map(Number);
    const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    console.log('  normalizedDate (UTC):', normalizedDate.toISOString());

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

      console.log('  slot found:', slot ? `✅ ID=${slot.id}` : '❌ NOT FOUND (conflict or bad date/time)');

      if (!slot) {
        // Extra diagnostic: check if slot exists at all (ignoring isBooked)
        const anySlot = await tx.availabilitySlot.findFirst({
          where: { expertId, date: normalizedDate, timeSlot },
        });
        console.log('  slot exists (any status):', anySlot ? `isBooked=${anySlot.isBooked}` : 'DOES NOT EXIST IN DB');

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

    console.log(`  ✅ BOOKING CREATED: ID=${booking.id}, token=${booking.managementToken}`);

    // Emit ONLY after successful commit — no false real-time signals
    if (io) {
      io.to(expertId).emit('slot-booked', {
        expertId,
        bookingDate: normalizedDate,
        timeSlot,
        bookingId: booking.id,
      });
    }

    // SIMULATED EMAIL DISPATCH
    // In production, this would use SendGrid/AWS SES to email the user
    console.log('\n======================================================');
    console.log(`📧 SIMULATED MAGIC LINK EMAIL DISPATCHED`);
    console.log(`To: ${booking.userEmail}`);
    console.log(`Subject: Your Session with ${booking.expertName} is Confirmed`);
    console.log(`\nHello ${booking.userName},`);
    console.log(`Your session on ${bookingDate} at ${timeSlot} is confirmed.`);
    console.log(`\nSecurely manage your booking here:`);
    console.log(`http://localhost:5173/manage/${booking.managementToken}`);
    console.log('======================================================\n');

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
 * GET /api/bookings/manage/:token
 * Fetch a specific booking using its secure management token.
 */
const getBookingByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { managementToken: token },
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

    if (!booking) throw new NotFoundError('Secure booking link is invalid or expired.');

    res.json({
      success: true,
      data: formatBooking(booking),
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
 * PATCH /api/bookings/manage/:token/status
 * State machine: PENDING → CONFIRMED → COMPLETED (or any → CANCELLED)
 * Now requires the secure management token to perform the action.
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { token } = req.params;
    const newStatus = status?.toUpperCase();

    const booking = await prisma.booking.findUnique({
      where: { managementToken: token },
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
      where: { managementToken: token },
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
  getBookingByToken,
  getBookingById,
  updateBookingStatus,
  setIO,
};
