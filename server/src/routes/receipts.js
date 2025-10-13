import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import {
    scanReceiptImage,
    getReceipts,
    getReceiptById,
    deleteReceipt,
} from '../controllers/receiptController.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('רק קבצי תמונה (JPG, PNG, WEBP) או PDF מותרים'), false);
        }
    },
});

router.post('/scan', auth, upload.single('receipt'), scanReceiptImage);
router.get('/', auth, getReceipts);
router.get('/:id', auth, getReceiptById);
router.delete('/:id', auth, deleteReceipt);

export default router;

