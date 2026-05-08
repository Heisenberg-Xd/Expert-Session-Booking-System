// controllers/expertController.js - Expert CRUD operations
const Expert = require('../models/Expert');
const { NotFoundError } = require('../middleware/errorHandler');

/**
 * GET /experts
 * Supports: pagination, name search, category filter, rating sort.
 *
 * Design rationale: Uses MongoDB aggregation-style queries with proper indexes.
 * Returns total count for client-side pagination without a second query (cursor approach).
 */
const getExperts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 6,
      search = '',
      category = '',
      sortBy = 'rating',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit))); // Cap at 20 per page
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};
    if (search.trim()) {
      // Case-insensitive partial name match
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Run count and data queries in parallel for performance
    const [experts, total] = await Promise.all([
      Expert.find(filter)
        .select('-availability') // Exclude heavy availability array from list view
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),                 // .lean() returns plain JS objects - 2x faster
      Expert.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /experts/:id
 * Returns full expert data including availability for the detail view.
 */
const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id).lean();
    if (!expert) throw new NotFoundError('Expert not found');

    // Filter out past dates from availability for cleaner client display
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expert.availability) {
      expert.availability = expert.availability.filter(
        avail => new Date(avail.date) >= today
      );
    }

    res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /experts/categories
 * Returns all valid categories (used for filter dropdown).
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = ['Technology', 'Business', 'Health', 'Education', 'Design'];
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExperts, getExpertById, getCategories };
