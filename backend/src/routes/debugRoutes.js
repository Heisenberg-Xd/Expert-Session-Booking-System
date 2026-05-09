// routes/debugRoutes.js — Temporary diagnostic endpoint
// REMOVE IN PRODUCTION once booking issues are resolved.
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');

/**
 * GET /api/debug/slot-check?expertId=X&bookingDate=YYYY-MM-DD&timeSlot=10:00 AM
 *
 * Returns full diagnostic info comparing incoming request against DB state.
 * Shows exact stored date values, timezone info, and query result.
 */
router.get('/slot-check', async (req, res) => {
  try {
    const { expertId, bookingDate, timeSlot } = req.query;

    if (!expertId || !bookingDate || !timeSlot) {
      return res.status(400).json({ error: 'expertId, bookingDate, and timeSlot are all required' });
    }

    // Parse exactly as the booking controller does
    const [year, month, day] = bookingDate.split('T')[0].split('-').map(Number);
    const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const canonicalTimeSlot = timeSlot.trim();

    // Find the slot with all possible states
    const slot = await prisma.availabilitySlot.findFirst({
      where: { expertId, date: normalizedDate, timeSlot: canonicalTimeSlot },
    });

    // Also fetch all slots for this expert on this date (for context)
    const allSlotsOnDate = await prisma.availabilitySlot.findMany({
      where: { expertId, date: normalizedDate },
      orderBy: { timeSlot: 'asc' },
      select: { id: true, timeSlot: true, isBooked: true, date: true },
    });

    // Fetch a raw sample of ALL slots for this expert (first 5) to see how dates are stored
    const rawSample = await prisma.availabilitySlot.findMany({
      where: { expertId },
      take: 5,
      select: { id: true, date: true, timeSlot: true, isBooked: true },
    });

    res.json({
      debug: {
        request: {
          expertId,
          bookingDate_raw: bookingDate,
          timeSlot_raw: timeSlot,
          timeSlot_canonical: canonicalTimeSlot,
        },
        normalizedDate: {
          iso: normalizedDate.toISOString(),
          utcMidnight: normalizedDate.toISOString() === `${bookingDate.split('T')[0]}T00:00:00.000Z`,
        },
        serverTimezone: {
          offset: new Date().getTimezoneOffset(),
          localMidnight: (() => { const d = new Date(bookingDate); d.setHours(0,0,0,0); return d.toISOString(); })(),
          utcMidnight: normalizedDate.toISOString(),
          areDifferent: (() => {
            const local = new Date(bookingDate); local.setHours(0,0,0,0);
            return local.toISOString() !== normalizedDate.toISOString();
          })(),
        },
        slot_found: slot ? {
          id: slot.id,
          date_stored: slot.date,
          timeSlot_stored: slot.timeSlot,
          isBooked: slot.isBooked,
          date_matches_query: slot.date.toISOString() === normalizedDate.toISOString(),
        } : null,
        allSlotsOnDate: allSlotsOnDate.map(s => ({
          id: s.id,
          date_stored: s.date,
          timeSlot: s.timeSlot,
          isBooked: s.isBooked,
        })),
        rawSample_first5: rawSample.map(s => ({
          id: s.id,
          date_stored: s.date,
          timeSlot: s.timeSlot,
          isBooked: s.isBooked,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
