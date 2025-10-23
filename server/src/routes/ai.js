import express from 'express';
import { getRecommendations } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/recommendations', getRecommendations);

export default router;

