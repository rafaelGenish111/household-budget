import express from 'express';
import {
    getDebts,
    getDebt,
    createDebt,
    updateDebt,
    deleteDebt,
    addPayment,
    getDebtsSummary,
    getUpcomingDebts,
} from '../controllers/debtController.js';
import { auth as protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getDebts).post(createDebt);
router.get('/summary', getDebtsSummary);
router.get('/upcoming', getUpcomingDebts);
router.route('/:id').get(getDebt).put(updateDebt).delete(deleteDebt);
router.post('/:id/payment', addPayment);

export default router;


