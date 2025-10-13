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
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('רק קבצי תמונה מותרים'), false);
        }
    },
});

router.post('/scan', auth, upload.single('receipt'), scanReceiptImage);
router.get('/', auth, getReceipts);
router.get('/:id', auth, getReceiptById);
router.delete('/:id', auth, deleteReceipt);

export default router;

