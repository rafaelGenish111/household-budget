import express from 'express';
import {
    getMaasrot,
    addDonation,
    updateDonation,
    deleteDonation,
    updateMonthlyIncome,
} from '../controllers/maasrotController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/maasrot
// @desc    Get maasrot data for household
// @access  Private
router.get('/', getMaasrot);

// @route   POST /api/maasrot/donation
// @desc    Add donation to maasrot
// @access  Private
router.post('/donation', addDonation);

// @route   PUT /api/maasrot/donation/:donationId
// @desc    Update donation
// @access  Private
router.put('/donation/:donationId', updateDonation);

// @route   DELETE /api/maasrot/donation/:donationId
// @desc    Delete donation
// @access  Private
router.delete('/donation/:donationId', deleteDonation);

// @route   PUT /api/maasrot/income
// @desc    Update monthly income and recalculate target
// @access  Private
router.put('/income', updateMonthlyIncome);

export default router;
