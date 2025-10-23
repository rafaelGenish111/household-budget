/**
 * Routes לחשבוניות רב-תמונתיות
 */

import express from 'express';
import multer from 'multer';
import {
    createSession,
    addImageToSession,
    completeSession,
    cancelSession,
    getActiveSessions,
    getCompletedSession
} from '../controllers/multiImageReceiptController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// הגדרת multer לטעינת קבצים
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // קבל רק תמונות
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('רק קבצי תמונה מותרים'), false);
        }
    }
});

// כל ה-routes דורשים אימות
router.use(protect);

/**
 * POST /api/multi-receipt/sessions
 * יוצר סשן חדש לסריקת חשבונית רב-תמונתית
 */
router.post('/sessions', createSession);

/**
 * GET /api/multi-receipt/sessions/active
 * מקבל רשימת סשנים פעילים
 */
router.get('/sessions/active', getActiveSessions);

/**
 * POST /api/multi-receipt/sessions/:sessionId/images
 * מוסיף תמונה לסשן קיים
 */
router.post('/sessions/:sessionId/images', upload.single('image'), addImageToSession);

/**
 * POST /api/multi-receipt/sessions/:sessionId/complete
 * מסיים את הסשן ומבצע מיזוג
 */
router.post('/sessions/:sessionId/complete', completeSession);

/**
 * GET /api/multi-receipt/sessions/:sessionId/completed
 * מקבל סשן שהושלם
 */
router.get('/sessions/:sessionId/completed', getCompletedSession);

export default router;
