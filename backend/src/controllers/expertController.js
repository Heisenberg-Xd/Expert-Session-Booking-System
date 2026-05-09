// 🏢 Expert Controller handles data retrieval for the expert entities.
// Manages paginated expert lists, categories, and detailed expert profiles with future slots.
// Added feature: paginated expert listing with category filters.
// controllers/expertController.js — Prisma-powered expert queries
const prisma = require('../lib/prisma');
const { NotFoundError } = require('../middleware/errorHandler');

/**
 * GET /api/experts
 * Paginated list with search, category filter, and rating sort.
 * Uses prisma.expert.findMany with skip/take for offset pagination.
 */
const getExperts = async (req, res, next) => {
  try {
    const {
      page     = 1,
      limit    = 6,
      search   = '',
      category = '',
      sortBy   = 'rating',
      order    = 'desc',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // Build Prisma where clause
    const where = {};

    if (search.trim()) {
      // Case-insensitive partial name match using Prisma's `contains` with `mode: 'insensitive'`
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    if (category) {
      // Validate against enum values — Prisma throws if invalid, but we guard here
      const validCategories = ['Technology', 'Business', 'Health', 'Education', 'Design'];
      if (validCategories.includes(category)) {
        where.category = category;
      }
    }

    // Determine sort field — only allow known safe fields
    const allowedSorts = { rating: 'rating', experience: 'experience', name: 'name', hourlyRate: 'hourlyRate' };
    const sortField = allowedSorts[sortBy] ?? 'rating';
    const sortDir   = order === 'asc' ? 'asc' : 'desc';

    // Run count + data in parallel — same pattern as Mongo, avoids double round-trips
    const [total, experts] = await Promise.all([
      prisma.expert.count({ where }),
      prisma.expert.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take: limitNum,
        // Exclude slots from list view — heavy relation not needed here
        select: {
          id:           true,
          name:         true,
          category:     true,
          experience:   true,
          rating:       true,
          bio:          true,
          profileImage: true,
          hourlyRate:   true,
          verified:     true,
          company:      true,
          role:         true,
          createdAt:    true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum * limitNum < total,
        hasPrev:    pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/experts/categories
 * Returns all valid enum values for the category filter dropdown.
 */
const getCategories = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: ['Technology', 'Business', 'Health', 'Education', 'Design'],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/experts/:id
 * Returns expert + availability slots for the next 7 days grouped by date.
 * Only returns future/today slots; past dates are excluded.
 */
const getExpertById = async (req, res, next) => {
  try {
    // Use UTC midnight so it matches how seed slots are stored in Postgres.
    // setHours() runs in local timezone and would break on non-UTC servers.
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const expert = await prisma.expert.findUnique({
      where: { id: req.params.id },
      include: {
        slots: {
          where: {
            date: { gte: today },    // Only future slots
          },
          orderBy: [
            { date:     'asc' },
            { timeSlot: 'asc' },
          ],
          select: {
            id:       true,
            date:     true,
            timeSlot: true,
            isBooked: true,
          },
        },
      },
    });

    if (!expert) throw new NotFoundError('Expert not found');

    // Group slots by date — mirrors the old Mongo embedded availability array
    // structure so the frontend ExpertDetail component needs zero changes.
    const availabilityMap = {};
    for (const slot of expert.slots) {
      // Use YYYY-MM-DD date key (UTC) — ensures clean round-trip when frontend
      // sends this date back in the booking request.
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!availabilityMap[dateKey]) {
        availabilityMap[dateKey] = { date: dateKey, slots: [] };
      }
      availabilityMap[dateKey].slots.push({
        id:       slot.id,
        time:     slot.timeSlot,
        isBooked: slot.isBooked,
      });
    }

    const response = {
      ...expert,
      availability: Object.values(availabilityMap),
      slots: undefined, // Remove raw slots; replaced by grouped availability
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/experts/apply
 * Submits a new application to become an expert.
 */
const applyExpert = async (req, res, next) => {
  try {
    const { name, email, linkedIn, company, role, category, experience, hourlyRate, portfolio, bio, reason } = req.body;

    const application = await prisma.expertApplication.create({
      data: {
        name,
        email,
        linkedIn,
        company,
        role,
        category,
        experience: parseInt(experience),
        hourlyRate: parseInt(hourlyRate),
        portfolio,
        bio,
        reason,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application received successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExperts, getExpertById, getCategories, applyExpert };
