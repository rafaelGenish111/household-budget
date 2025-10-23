import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getTimeRangeStats,
    getCategoryBreakdown,
    getTrendData,
    getComparison,
} from '../controllers/statisticsController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/statistics/range
// @desc    Get statistics for time range
// @access  Private
router.get('/range', getTimeRangeStats);

// @route   GET /api/statistics/categories
// @desc    Get category breakdown
// @access  Private
router.get('/categories', getCategoryBreakdown);

// @route   GET /api/statistics/trends
// @desc    Get trend data
// @access  Private
router.get('/trends', getTrendData);

// @route   GET /api/statistics/comparison
// @desc    Get comparison between periods
// @access  Private
router.get('/comparison', getComparison);

export default router;
