import express from 'express';
import {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionSummary,
    getTransactionsByCategory,
} from '../controllers/transactionController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/summary', getTransactionSummary);
router.get('/by-category', getTransactionsByCategory);
router.route('/').get(getTransactions).post(createTransaction);
router.route('/:id').get(getTransaction).put(updateTransaction).delete(deleteTransaction);

export default router;

