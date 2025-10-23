import express from 'express';
import {
    getCommitments,
    getCommitment,
    createCommitment,
    updateCommitment,
    deleteCommitment,
    recordPayment,
    getUpcomingCharges,
} from '../controllers/commitmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getCommitments).post(createCommitment);
router.get('/upcoming-charges', getUpcomingCharges);
router.route('/:id').get(getCommitment).put(updateCommitment).delete(deleteCommitment);
router.post('/:id/payment', recordPayment);

export default router;

