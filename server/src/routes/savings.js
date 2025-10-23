import express from 'express';
import {
    getSavings,
    getSaving,
    createSaving,
    updateSaving,
    deleteSaving,
    addContribution,
} from '../controllers/savingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getSavings).post(createSaving);
router.route('/:id').get(getSaving).put(updateSaving).delete(deleteSaving);
router.post('/:id/contribute', addContribution);

export default router;

