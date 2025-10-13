import express from 'express';
import {
    getCommitments,
    getCommitment,
    createCommitment,
    updateCommitment,
    deleteCommitment,
    recordPayment,
} from '../controllers/commitmentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.route('/').get(getCommitments).post(createCommitment);
router.route('/:id').get(getCommitment).put(updateCommitment).delete(deleteCommitment);
router.post('/:id/payment', recordPayment);

export default router;

