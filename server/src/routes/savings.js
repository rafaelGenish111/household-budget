import express from 'express';
import {
    getSavings,
    getSaving,
    createSaving,
    updateSaving,
    deleteSaving,
    addContribution,
} from '../controllers/savingController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.route('/').get(getSavings).post(createSaving);
router.route('/:id').get(getSaving).put(updateSaving).delete(deleteSaving);
router.post('/:id/contribute', addContribution);

export default router;

