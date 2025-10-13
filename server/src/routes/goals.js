import express from 'express';
import {
    getBudgetGoal,
    createOrUpdateBudgetGoal,
    getRemainingBudget,
} from '../controllers/goalController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.post('/', createOrUpdateBudgetGoal);
router.get('/:month', getBudgetGoal);
router.get('/:month/remaining/:category', getRemainingBudget);

export default router;

