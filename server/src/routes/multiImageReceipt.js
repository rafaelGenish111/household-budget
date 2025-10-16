/**
 * Routes לחשבוניות רב-תמונתיות
 */

import express from 'express';
import multer from 'multer';
import {
    createReceiptSession,
    addImageToSession,
    completeReceiptSession,
    cancelReceiptSession,
    getReceiptSession,
    getActiveSessions,
    getCompletedSessions,
    deleteReceiptSession,
    getSessionImage
} from '../controllers/multiImageReceiptController.js';
import { auth } from '../middleware/auth.js';

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
router.use(auth);

/**
 * POST /api/multi-receipt/sessions
 * יוצר סשן חדש לסריקת חשבונית רב-תמונתית
 */
router.post('/sessions', createReceiptSession);

/**
 * GET /api/multi-receipt/sessions/active
 * מקבל רשימת סשנים פעילים
 */
router.get('/sessions/active', getActiveSessions);

/**
 * GET /api/multi-receipt/sessions/completed
 * מקבל רשימת סשנים שהושלמו
 */
router.get('/sessions/completed', getCompletedSessions);

/**
 * GET /api/multi-receipt/sessions/:sessionId
 * מקבל פרטי סשן ספציפי
 */
router.get('/sessions/:sessionId', getReceiptSession);

/**
 * POST /api/multi-receipt/sessions/:sessionId/images
 * מוסיף תמונה לסשן קיים
 */
router.post('/sessions/:sessionId/images', upload.single('image'), addImageToSession);

/**
 * POST /api/multi-receipt/sessions/:sessionId/complete
 * מסיים את הסשן ומבצע מיזוג
 */
router.post('/sessions/:sessionId/complete', completeReceiptSession);

/**
 * POST /api/multi-receipt/sessions/:sessionId/cancel
 * מבטל סשן קיים
 */
router.post('/sessions/:sessionId/cancel', cancelReceiptSession);

/**
 * DELETE /api/multi-receipt/sessions/:sessionId
 * מוחק סשן קיים
 */
router.delete('/sessions/:sessionId', deleteReceiptSession);

/**
 * GET /api/multi-receipt/sessions/:sessionId/images/:imageId
 * מקבל תמונה ספציפית מסשן
 */
router.get('/sessions/:sessionId/images/:imageId', getSessionImage);

export default router;
