/**
 * Controller לחשבוניות רב-תמונתיות
 */

import ReceiptSession from '../models/ReceiptSession.js';
import { scanReceipt } from '../services/ocr/index.js';
import { findOverlap, analyzeOverlapQuality } from '../services/ocr/overlapDetector.js';
import { mergeReceipt } from '../services/ocr/receiptMerger.js';
import { preprocessImage } from '../services/ocr/preprocessor.js';
import { detectCategory } from '../utils/receiptScanner.js';
import { v4 as uuidv4 } from 'uuid';

// פונקציות עזר
function detectReceiptEnd(parsedData) {
    const endKeywords = [
        'תודה', 'תודה רבה', 'תודה לך',
        'סה"כ לתשלום', 'סך הכל לתשלום',
        'total', 'grand total', 'thank you',
        'תאריך', 'תאריך:', 'date:',
        'ח.ע.מ', 'ע.מ', 'tax id'
    ];

    const lastLines = parsedData.allLines.slice(-5);
    return lastLines.some(line =>
        endKeywords.some(keyword =>
            line.toLowerCase().includes(keyword.toLowerCase())
        )
    );
}

function getLastLines(allLines, count = 3) {
    return allLines.slice(-count).filter(line => line.trim());
}

/**
 * יוצר סשן חדש לסריקת חשבונית רב-תמונתית
 */
export const createSession = async (req, res) => {
    try {
        const { settings = {} } = req.body;

        const sessionId = uuidv4();
        const session = new ReceiptSession({
            sessionId,
            household: req.user.household,
            user: req.user._id,
            status: 'capturing',
            settings: {
                autoDetectEnd: true,
                minOverlapConfidence: 0.6,
                maxImages: 10,
                ...settings
            }
        });

        await session.save();

        res.status(201).json({
            sessionId: session.sessionId,
            status: session.status,
            settings: session.settings,
            createdAt: session.createdAt,
            imageCount: 0,
            canAddMore: true
        });

    } catch (error) {
        console.error('Error creating receipt session:', error);
        res.status(500).json({
            error: 'שגיאה ביצירת סשן סריקה',
            details: error.message
        });
    }
};

/**
 * מוסיף תמונה לסשן קיים
 */
export const addImageToSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'לא הועלה קובץ' });
        }

        // מצא את הסשן
        const session = await ReceiptSession.findOne({
            sessionId,
            household: req.user.household,
            user: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'סשן לא נמצא' });
        }

        if (session.images.length >= session.settings.maxImages) {
            return res.status(400).json({
                error: 'הגעת למספר המקסימלי של תמונות',
                maxImages: session.settings.maxImages
            });
        }

        // עיבוד התמונה
        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        // עיבוד מקדים
        const preprocessingResult = await preprocessImage(fileBuffer);

        // סריקה עם OCR
        const scanResult = await scanReceipt(preprocessingResult.processedBuffer, mimeType);

        if (scanResult.fallback) {
            return res.status(400).json({
                error: 'Vision API לא זמין',
                message: 'נדרש להפעיל Google Vision API לסריקת תמונות'
            });
        }

        // ניתוח הנתונים
        const parsedData = {
            ...scanResult,
            allLines: scanResult.text ? scanResult.text.split('\n').filter(line => line.trim()) : [],
            items: scanResult.items || [],
            total: scanResult.total,
            businessInfo: scanResult.businessInfo || {},
            date: scanResult.date
        };

        // בדיקת חפיפה עם התמונה הקודמת
        let overlapAnalysis = null;
        if (session.images.length > 0) {
            const lastImage = session.images[session.images.length - 1];
            overlapAnalysis = analyzeOverlapQuality(lastImage.parsedData, parsedData);
        }

        // הוסף את התמונה החדשה
        const newImage = {
            id: uuidv4(),
            order: session.images.length + 1,
            timestamp: new Date(),
            ocrResult: scanResult,
            parsedData: parsedData,
            overlappingLines: overlapAnalysis ? overlapAnalysis.overlap.overlapLines : []
        };

        session.images.push(newImage);
        await session.save();

        // בדיקה אם זוהה סוף החשבונית
        const receiptEndDetected = detectReceiptEnd(parsedData);

        res.json({
            imageId: newImage.id,
            order: newImage.order,
            parsedData: parsedData,
            overlapAnalysis: overlapAnalysis,
            receiptEndDetected: receiptEndDetected,
            canAddMore: session.images.length < session.settings.maxImages,
            sessionStatus: session.status,
            lastLines: getLastLines(parsedData.allLines, 3),
            imageCount: session.images.length
        });

    } catch (error) {
        console.error('Error adding image to session:', error);
        res.status(500).json({
            error: 'שגיאה בהוספת תמונה',
            details: error.message
        });
    }
};

/**
 * מסיים את הסשן ומבצע מיזוג
 */
export const completeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ReceiptSession.findOne({
            sessionId,
            household: req.user.household,
            user: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'סשן לא נמצא' });
        }

        if (session.images.length === 0) {
            return res.status(400).json({ error: 'אין תמונות בסשן' });
        }

        // עדכון סטטוס לעיבוד
        session.status = 'processing';
        await session.save();

        try {
            // מיזוג הנתונים
            const mergedResult = mergeReceipt(session);

            // השלמת הסשן
            session.status = 'completed';
            session.mergedResult = mergedResult;
            session.confidence = mergedResult.confidence;
            session.completedAt = new Date();
            await session.save();

            // זיהוי קטגוריה
            const category = detectCategory(mergedResult.businessInfo.name || '');
            const subcategory = category === 'מזון' ? 'סופרמרקט' : 'אחר';

            res.json({
                sessionId: session.sessionId,
                status: session.status,
                mergedResult: {
                    ...mergedResult,
                    category,
                    subcategory
                },
                validation: mergedResult.validation,
                confidence: session.confidence,
                completedAt: session.completedAt,
                imageCount: session.images.length
            });

        } catch (mergeError) {
            console.error('Error merging receipt:', mergeError);

            // עדכון סטטוס לכישלון
            session.status = 'failed';
            session.error = mergeError.message;
            await session.save();

            res.status(500).json({
                error: 'שגיאה במיזוג החשבונית',
                details: mergeError.message
            });
        }

    } catch (error) {
        console.error('Error completing receipt session:', error);
        res.status(500).json({
            error: 'שגיאה בהשלמת הסשן',
            details: error.message
        });
    }
};

/**
 * מבטל סשן קיים
 */
export const cancelSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ReceiptSession.findOne({
            sessionId,
            household: req.user.household,
            user: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'סשן לא נמצא' });
        }

        session.status = 'cancelled';
        session.updatedAt = new Date();
        await session.save();

        res.json({
            sessionId: session.sessionId,
            status: session.status,
            cancelledAt: session.updatedAt
        });

    } catch (error) {
        console.error('Error cancelling receipt session:', error);
        res.status(500).json({
            error: 'שגיאה בביטול הסשן',
            details: error.message
        });
    }
};

export const getActiveSessions = async (req, res) => {
    try {
        const sessions = await ReceiptSession.find({
            household: req.user.household,
            user: req.user._id,
            status: { $in: ['capturing', 'processing'] }
        }).sort({ createdAt: -1 });

        res.json(sessions.map(session => ({
            sessionId: session.sessionId,
            status: session.status,
            imageCount: session.images.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastLines: getLastLines(
                session.images.length > 0
                    ? session.images[session.images.length - 1].parsedData.allLines || []
                    : [],
                2
            )
        })));

    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({
            error: 'שגיאה בקבלת סשנים פעילים',
            details: error.message
        });
    }
};

export const getCompletedSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ReceiptSession.findOne({
            sessionId,
            household: req.user.household,
            user: req.user._id,
            status: 'completed'
        });

        if (!session) {
            return res.status(404).json({ error: 'סשן לא נמצא או לא הושלם' });
        }

        res.json({
            sessionId: session.sessionId,
            status: session.status,
            imageCount: session.images.length,
            confidence: session.confidence,
            validation: session.mergedResult?.validation,
            mergedResult: session.mergedResult,
            completedAt: session.completedAt
        });

    } catch (error) {
        console.error('Error getting completed session:', error);
        res.status(500).json({
            error: 'שגיאה בקבלת הסשן שהושלם',
            details: error.message
        });
    }
};
