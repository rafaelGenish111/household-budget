import Receipt from '../models/Receipt.js';
import { scanReceipt, detectCategory } from '../utils/receiptScanner.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const scanReceiptImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'לא הועלתה תמונה' });
        }

        let imageBuffer = req.file.buffer;

        // Resize and optimize image
        imageBuffer = await sharp(imageBuffer)
            .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer();

        // Scan receipt
        const scannedData = await scanReceipt(imageBuffer);

        // Detect category
        const category = detectCategory(scannedData.businessName);
        const subcategory = category === 'מזון' ? 'סופרמרקט' : 'אחר';

        // Save image to disk
        const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
        await fs.mkdir(uploadsDir, { recursive: true });

        const filename = `receipt-${Date.now()}-${req.user._id}.jpg`;
        const filepath = path.join(uploadsDir, filename);
        await fs.writeFile(filepath, imageBuffer);

        // Create receipt record
        const receipt = new Receipt({
            household: req.user.household,
            imageUrl: `/uploads/receipts/${filename}`,
            scannedData: {
                ...scannedData,
                category,
            },
            user: req.user._id,
        });

        await receipt.save();

        res.json({
            receiptId: receipt._id,
            date: scannedData.date,
            total: scannedData.total,
            businessName: scannedData.businessName,
            category,
            subcategory,
            items: scannedData.items,
            imageUrl: receipt.imageUrl,
            confidence: scannedData.confidence,
            rawText: scannedData.rawText,
        });
    } catch (error) {
        console.error('Receipt scan error:', error);
        res.status(500).json({
            error: 'שגיאה בסריקת החשבונית',
            details: error.message,
        });
    }
};

export const getReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find({
            household: req.user.household,
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'name')
            .populate('transaction');

        res.json(receipts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getReceiptById = async (req, res) => {
    try {
        const receipt = await Receipt.findOne({
            _id: req.params.id,
            household: req.user.household,
        })
            .populate('user', 'name')
            .populate('transaction');

        if (!receipt) {
            return res.status(404).json({ error: 'חשבונית לא נמצאה' });
        }

        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteReceipt = async (req, res) => {
    try {
        const receipt = await Receipt.findOne({
            _id: req.params.id,
            household: req.user.household,
        });

        if (!receipt) {
            return res.status(404).json({ error: 'חשבונית לא נמצאה' });
        }

        // Delete image file
        const filepath = path.join(process.cwd(), receipt.imageUrl);
        try {
            await fs.unlink(filepath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }

        await receipt.deleteOne();

        res.json({ message: 'החשבונית נמחקה בהצלחה' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

