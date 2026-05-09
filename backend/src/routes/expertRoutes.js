// routes/expertRoutes.js — unchanged route paths (frontend contract preserved)
const express = require('express');
const router  = express.Router();
const { getExperts, getExpertById, getCategories, applyExpert } = require('../controllers/expertController');

// GET /api/experts/categories — MUST come before /:id to prevent routing conflict
router.get('/categories', getCategories);

// POST /api/experts/apply
router.post('/apply', applyExpert);

// GET /api/experts?page=1&limit=6&search=&category=&sortBy=rating&order=desc
router.get('/', getExperts);

// GET /api/experts/:id
router.get('/:id', getExpertById);

module.exports = router;
