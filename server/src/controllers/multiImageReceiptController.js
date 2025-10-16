/**
 * Controller לחשבוניות רב-תמונתיות
 */

import ReceiptSession from '../models/ReceiptSession.js';
import { scanReceipt } from '../services/ocr/index.js';
import { findOverlap, analyzeOverlapQuality } from '../services/ocr/overlapDetector.js';
import { mergeReceipt } from '../services/ocr/receiptMerger.js';
import { preprocessImage } from '../services/ocr/preprocessor.js';
import { detectCategory } from '../utils/receiptScanner.js';

/**
 * יוצר סשן חדש לסריקת חשבונית רב-תמונתית
 */
export const createReceiptSession = async (req, res) => {
    try {
        const { settings = {} } = req.body;
        
        const session = ReceiptSession.createNewSession(
            req.user.household,
            req.user._id,
            settings
        );
        
        await session.save();
        
        res.json({
            sessionId: session.sessionId,
            status: session.status,
            settings: session.settings,
            createdAt: session.createdAt
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
        
        if (!session.canAddMoreImages()) {
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
            allLines: scanResult.text.split('\n').filter(line => line.trim()),
            items: scanResult.items || [],
            total: scanResult.total,
            businessInfo: scanResult.businessInfo || {},
            date: scanResult.date
        };
        
        // בדיקת חפיפה עם התמונה הקודמת
        let overlapAnalysis = null;
        if (session.images.length > 0) {
            const lastImage = session.getLastImage();
            overlapAnalysis = analyzeOverlapQuality(lastImage.parsedData, parsedData);
            
            // עדכן את התמונה הקודמת עם נתוני החפיפה
            session.updateOverlap(session.images.length - 1, {
                lines: overlapAnalysis.overlap.overlapLines,
                confidence: overlapAnalysis.overlap.confidence
            });
        }
        
        // הוסף את התמונה החדשה
        const newImage = session.addImage({
            blob: fileBuffer,
            processedBlob: preprocessingResult.processedBuffer,
            ocrResult: scanResult,
            parsedData: parsedData,
            metadata: {
                width: preprocessingResult.metadata.processed.width,
                height: preprocessingResult.metadata.processed.height,
                fileSize: fileBuffer.length,
                processingTime: scanResult.processingTime
            }
        });
        
        await session.save();
        
        // בדיקה אם זוהה סוף החשבונית
        const receiptEndDetected = session.detectReceiptEnd();
        
        res.json({
            imageId: newImage.id,
            order: newImage.order,
            parsedData: parsedData,
            overlapAnalysis: overlapAnalysis,
            receiptEndDetected: receiptEndDetected,
            canAddMore: session.canAddMoreImages(),
            sessionStatus: session.status,
            lastLines: session.getLastLines(3)
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
export const completeReceiptSession = async (req, res) => {
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
            session.completeSession(mergedResult, mergedResult.validation);
            await session.save();
            
            // זיהוי קטגוריה
            const category = detectCategory(mergedResult.businessInfo.name);
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
                completedAt: session.completedAt
            });
            
        } catch (mergeError) {
            console.error('Error merging receipt:', mergeError);
            
            // עדכון סטטוס לכישלון
            session.status = 'failed';
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
export const cancelReceiptSession = async (req, res) => {
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
        
        session.cancelSession();
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

/**
 * מקבל פרטי סשן קיים
 */
export const getReceiptSession = async (req, res) => {
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
        
        res.json({
            sessionId: session.sessionId,
            status: session.status,
            imageCount: session.imageCount,
            progress: session.progress,
            settings: session.settings,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            completedAt: session.completedAt,
            lastLines: session.getLastLines(3),
            canAddMore: session.canAddMoreImages(),
            receiptEndDetected: session.detectReceiptEnd()
        });
        
    } catch (error) {
        console.error('Error getting receipt session:', error);
        res.status(500).json({
            error: 'שגיאה בקבלת פרטי הסשן',
            details: error.message
        });
    }
};

/**
 * מקבל רשימת סשנים פעילים
 */
export const getActiveSessions = async (req, res) => {
    try {
        const sessions = await ReceiptSession.findActiveSessions(
            req.user.household,
            req.user._id
        );
        
        res.json(sessions.map(session => ({
            sessionId: session.sessionId,
            status: session.status,
            imageCount: session.imageCount,
            progress: session.progress,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastLines: session.getLastLines(2)
        })));
        
    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({
            error: 'שגיאה בקבלת סשנים פעילים',
            details: error.message
        });
    }
};

/**
 * מקבל רשימת סשנים שהושלמו
 */
export const getCompletedSessions = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const sessions = await ReceiptSession.findCompletedSessions(
            req.user.household,
            req.user._id,
            parseInt(limit)
        );
        
        res.json(sessions.map(session => ({
            sessionId: session.sessionId,
            status: session.status,
            imageCount: session.imageCount,
            confidence: session.confidence,
            validation: session.validation,
            mergedResult: {
                total: session.mergedResult.total,
                businessInfo: session.mergedResult.businessInfo,
                itemsCount: session.mergedResult.items.length,
                date: session.mergedResult.date
            },
            completedAt: session.completedAt
        })));
        
    } catch (error) {
        console.error('Error getting completed sessions:', error);
        res.status(500).json({
            error: 'שגיאה בקבלת סשנים שהושלמו',
            details: error.message
        });
    }
};

/**
 * מוחק סשן קיים
 */
export const deleteReceiptSession = async (req, res) => {
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
        
        await session.deleteOne();
        
        res.json({
            message: 'הסשן נמחק בהצלחה',
            sessionId: sessionId
        });
        
    } catch (error) {
        console.error('Error deleting receipt session:', error);
        res.status(500).json({
            error: 'שגיאה במחיקת הסשן',
            details: error.message
        });
    }
};

/**
 * מקבל תמונה ספציפית מסשן
 */
export const getSessionImage = async (req, res) => {
    try {
        const { sessionId, imageId } = req.params;
        
        const session = await ReceiptSession.findOne({
            sessionId,
            household: req.user.household,
            user: req.user._id
        });
        
        if (!session) {
            return res.status(404).json({ error: 'סשן לא נמצא' });
        }
        
        const image = session.images.find(img => img.id === imageId);
        
        if (!image) {
            return res.status(404).json({ error: 'תמונה לא נמצאה' });
        }
        
        res.json({
            imageId: image.id,
            order: image.order,
            timestamp: image.timestamp,
            parsedData: image.parsedData,
            overlapConfidence: image.overlapConfidence,
            metadata: image.metadata
        });
        
    } catch (error) {
        console.error('Error getting session image:', error);
        res.status(500).json({
            error: 'שגיאה בקבלת התמונה',
            details: error.message
        });
    }
};
