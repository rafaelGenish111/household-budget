import Receipt from '../models/Receipt.js';
import { scanReceipt } from '../services/ocr/index.js';
import { detectCategory } from '../utils/receiptScanner.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const scanReceiptImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'לא הועלה קובץ' });
        }

        let fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        console.log('📄 קובץ התקבל:', {
            mimetype: mimeType,
            size: req.file.size,
            originalName: req.file.originalname
        });

        // אם זה תמונה, בצע אופטימיזציה
        if (mimeType.startsWith('image/')) {
            console.log('🖼️ מבצע אופטימיזציה לתמונה...');
            try {
                fileBuffer = await sharp(fileBuffer)
                    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 90 })
                    .toBuffer();
                console.log('✅ אופטימיזציה הושלמה בהצלחה');
            } catch (sharpError) {
                console.warn('⚠️ שגיאה בעיבוד התמונה עם Sharp:', sharpError.message);
                console.log('📝 ממשיך ללא אופטימיזציה...');
                // המשך עם הקובץ המקורי אם sharp נכשל
                // זה יכול לקרות בסביבות serverless או אם sharp לא מותקן נכון
            }
        }

        // Scan receipt with enhanced OCR system
        const scannedData = await scanReceipt(fileBuffer, mimeType);

        // Detect category
        const category = detectCategory(scannedData.businessName);
        const subcategory = category === 'מזון' ? 'סופרמרקט' : 'אחר';

        let imageUrl = '';

        // Save image to disk only in development (Vercel doesn't support file writes)
        if (process.env.NODE_ENV !== 'production' && mimeType.startsWith('image/')) {
            try {
                const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
                await fs.mkdir(uploadsDir, { recursive: true });

                const filename = `receipt-${Date.now()}-${req.user._id}.jpg`;
                const filepath = path.join(uploadsDir, filename);
                await fs.writeFile(filepath, fileBuffer);
                imageUrl = `/uploads/receipts/${filename}`;
            } catch (fileError) {
                console.warn('Could not save file (serverless environment):', fileError.message);
            }
        }

        // Create receipt record
        const isPdf = mimeType && mimeType.includes('pdf');

        const receipt = new Receipt({
            household: req.user.household,
            imageUrl:
                imageUrl ||
                (!isPdf ? `data:image/jpeg;base64,${fileBuffer.toString('base64')}` : ''),
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
            businessInfo: scannedData.businessInfo,
            category,
            subcategory,
            items: scannedData.items,
            itemsCount: scannedData.itemsCount,
            itemsTotal: scannedData.itemsTotal,
            imageUrl: receipt.imageUrl,
            isPdf,
            confidence: scannedData.confidence,
            rawText: scannedData.rawText,
            // נתונים חדשים מהמערכת המשופרת
            validation: scannedData.validation,
            qualitySummary: scannedData.qualitySummary,
            suggestions: scannedData.suggestions,
            processingTime: scannedData.processingTime,
            sessionId: scannedData.sessionId,
            scanInfo: scannedData.scanInfo,
            imageQuality: scannedData.imageQuality,
            fallback: scannedData.fallback || false,
            error: scannedData.error || false
        });
    } catch (error) {
        console.error('❌ Receipt scan error:', error);
        console.error('Error stack:', error.stack);
        
        // זיהוי סוג השגיאה והחזרת הודעה מתאימה
        let errorMessage = 'שגיאה בסריקת החשבונית';
        let errorDetails = error.message;
        
        if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
            errorMessage = 'Vision API לא מוגדר';
            errorDetails = 'נדרש להגדיר את GOOGLE_APPLICATION_CREDENTIALS במשתני הסביבה';
        } else if (error.message.includes('PERMISSION_DENIED') || error.message.includes('billing')) {
            errorMessage = 'Vision API לא זמין';
            errorDetails = 'נדרש להפעיל Billing ו-Vision API בפרויקט Google Cloud';
        } else if (error.message.includes('Sharp') || error.message.includes('sharp')) {
            errorMessage = 'שגיאה בעיבוד התמונה';
            errorDetails = 'התמונה לא עובדה כראוי, אבל הסריקה יכולה להמשיך';
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
            errorMessage = 'פסק זמן בסריקה';
            errorDetails = 'הסריקה לקחה יותר מדי זמן. נסה שוב עם תמונה קטנה יותר';
        }
        
        res.status(500).json({
            error: errorMessage,
            details: errorDetails,
            type: error.name || 'UnknownError',
            timestamp: new Date().toISOString()
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

