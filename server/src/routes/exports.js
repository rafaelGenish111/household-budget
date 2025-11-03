import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    exportTransactionsToExcel,
    exportMonthlyReportToExcel,
    exportYearlyReportToExcel,
    exportMaasrotToExcel
} from '../controllers/exportController.js';

const router = express.Router();

router.get('/transactions', protect, exportTransactionsToExcel);
router.get('/monthly', protect, exportMonthlyReportToExcel);
router.get('/yearly', protect, exportYearlyReportToExcel);
router.get('/maasrot', protect, exportMaasrotToExcel);

export default router;

