// routes/expertRoutes.js
const express = require('express');
const router = express.Router();
const { getExperts, getExpertById, getCategories } = require('../controllers/expertController');

// GET /api/experts/categories - Must be BEFORE /:id to avoid routing conflict
router.get('/categories', getCategories);

// GET /api/experts?page=1&limit=6&search=&category=&sortBy=rating
router.get('/', getExperts);

// GET /api/experts/:id
router.get('/:id', getExpertById);

module.exports = router;
