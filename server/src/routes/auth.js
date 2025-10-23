import express from 'express';
import {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    verifyInvitation,
    registerWithInvitation,
    acceptInvitation,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/invitation/:token', verifyInvitation);
router.post('/register-with-invitation', registerWithInvitation);
router.post('/accept-invitation', auth, acceptInvitation);

export default router;

