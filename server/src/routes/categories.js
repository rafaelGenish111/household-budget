import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/categoryController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.route('/').get(getCategories).post(createCategory);
router.route('/:id').put(updateCategory).delete(deleteCategory);

export default router;

