import express from 'express';
import { getRecommendations } from '../controllers/aiController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/recommendations', getRecommendations);

export default router;

