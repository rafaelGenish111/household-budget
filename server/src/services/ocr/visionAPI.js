/**
 * שירות Google Vision API משופר עם תמיכה בעברית ו-fallback חכם
 */

import vision from '@google-cloud/vision';
import fs from 'fs';
import { preprocessImage, needsPreprocessing } from './preprocessor.js';

// Polyfills עבור pdf-parse בסביבת Serverless
async function getPdfParse() {
    if (typeof globalThis.DOMMatrix === 'undefined') {
        globalThis.DOMMatrix = class { };
    }
    if (typeof globalThis.Path2D === 'undefined') {
        globalThis.Path2D = class { };
    }
    if (typeof globalThis.ImageData === 'undefined') {
        globalThis.ImageData = class { };
    }

    const mod = await import('pdf-parse');
    return mod.default || mod;
}

/**
 * מחזיר את פרטי האימות של Google Cloud
 * @returns {Object} - פרטי האימות
 */
function getCredentials() {
    let credentials;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // אם זה JSON string (ב-Vercel), פרס אותו
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
            credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        } else {
            // אם זה נתיב לקובץ (ב-development), קרא את הקובץ
            credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
        }
    } else {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS לא מוגדר');
    }

    console.log('🔑 משתמש ב-Service Account:', credentials.client_email);
    console.log('📦 Project ID:', credentials.project_id);

    return credentials;
}

/**
 * סורק תמונה עם Google Vision API עם שיפורים
 * @param {Buffer} imageBuffer - Buffer של התמונה
 * @param {Object} options - אפשרויות סריקה
 * @returns {Promise<Object>} - תוצאות הסריקה
 */
export async function scanImageWithVision(imageBuffer, options = {}) {
    const {
        usePreprocessing = true,
        languageHints = ['he', 'en'],
        maxRetries = 3,
        retryDelay = 1000
    } = options;

    let processedBuffer = imageBuffer;
    let preprocessingApplied = false;

    try {
        console.log('🔍 מתחיל סריקה עם Google Vision API...');

        // בדיקה אם נדרש עיבוד מקדים
        if (usePreprocessing && await needsPreprocessing(imageBuffer)) {
            console.log('🔧 מבצע עיבוד מקדים...');
            const preprocessingResult = await preprocessImage(imageBuffer);
            processedBuffer = preprocessingResult.processedBuffer;
            preprocessingApplied = true;
            console.log('✅ עיבוד מקדים הושלם');
        }

        const credentials = getCredentials();
        const client = new vision.ImageAnnotatorClient({
            projectId: credentials.project_id,
            credentials: credentials,
        });

        // הגדרת פרמטרים משופרים לסריקה
        const imageContext = {
            languageHints: languageHints,
            textDetectionParams: {
                enableTextDetectionConfidenceScore: true
            }
        };

        // ניסיון סריקה עם retry logic
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 ניסיון ${attempt}/${maxRetries}...`);

                // שימוש ב-DOCUMENT_TEXT_DETECTION במקום TEXT_DETECTION
                const [result] = await client.documentTextDetection({
                    image: { content: processedBuffer },
                    imageContext: imageContext
                });

                const detections = result.textAnnotations;

                if (!detections || detections.length === 0) {
                    throw new Error('לא זוהה טקסט בתמונה');
                }

                const text = detections[0].description;
                const confidence = detections[0].score || 0.8; // ברירת מחדל אם אין ציון

                console.log('✅ Google Vision זיהה טקסט בהצלחה!');
                console.log('📊 פרטי הסריקה:', {
                    textLength: text.length,
                    confidence: confidence,
                    preprocessingApplied: preprocessingApplied,
                    attempt: attempt
                });

                return {
                    text,
                    confidence,
                    preprocessingApplied,
                    attempt,
                    rawDetections: detections,
                    imageContext: imageContext
                };

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ ניסיון ${attempt} נכשל:`, error.message);

                if (attempt < maxRetries) {
                    const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`⏳ ממתין ${delay}ms לפני ניסיון נוסף...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;

    } catch (error) {
        console.error('❌ שגיאה בסריקת Vision API:', error);

        // אם יש שגיאת הרשאות או Billing, החזר מצב fallback
        if (error.code === 7 ||
            error.code === 'PERMISSION_DENIED' ||
            error.message.includes('PERMISSION_DENIED') ||
            error.message.includes('billing') ||
            error.message.includes('API not enabled')) {

            console.log('⚠️ Google Cloud Vision לא זמין (צריך להפעיל Billing/API)');
            return {
                text: '',
                confidence: 0,
                preprocessingApplied: preprocessingApplied,
                error: 'Vision API לא זמין',
                fallback: true
            };
        }

        throw new Error(`שגיאה בסריקת Vision API: ${error.message}`);
    }
}

/**
 * סורק PDF עם חילוץ טקסט ישיר
 * @param {Buffer} pdfBuffer - Buffer של קובץ PDF
 * @returns {Promise<Object>} - תוצאות הסריקה
 */
export async function scanPdfWithVision(pdfBuffer) {
    try {
        console.log('📄 מזהה PDF - מנסה לחלץ טקסט...');

        const pdfParse = await getPdfParse();
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;

        if (!text || text.trim().length === 0) {
            throw new Error('PDF ריק או לא קריא');
        }

        console.log('✅ טקסט חולץ מ-PDF בהצלחה!');
        console.log('📊 פרטי PDF:', {
            textLength: text.length,
            pages: pdfData.numpages,
            info: pdfData.info
        });

        return {
            text,
            confidence: 0.9, // PDF בדרך כלל יותר אמין
            preprocessingApplied: false,
            pdfInfo: {
                pages: pdfData.numpages,
                info: pdfData.info
            }
        };

    } catch (error) {
        console.error('❌ שגיאה בחילוץ טקסט מ-PDF:', error.message);
        throw new Error(`שגיאה בסריקת PDF: ${error.message}`);
    }
}

/**
 * פונקציה ראשית לסריקת חשבונית (תמונה או PDF)
 * @param {Buffer} fileBuffer - Buffer של הקובץ
 * @param {string} mimeType - סוג הקובץ
 * @param {Object} options - אפשרויות סריקה
 * @returns {Promise<Object>} - תוצאות הסריקה המלאות
 */
export async function scanReceipt(fileBuffer, mimeType = 'image/jpeg', options = {}) {
    const startTime = Date.now();

    try {
        console.log('🚀 מתחיל סריקת חשבונית משופרת...');
        console.log('📄 פרטי הקובץ:', {
            mimetype: mimeType,
            size: fileBuffer.length,
            timestamp: new Date().toISOString()
        });

        let scanResult;

        if (mimeType === 'application/pdf') {
            scanResult = await scanPdfWithVision(fileBuffer);
        } else {
            scanResult = await scanImageWithVision(fileBuffer, options);
        }

        const processingTime = Date.now() - startTime;

        console.log('✅ סריקה הושלמה:', {
            processingTime: `${processingTime}ms`,
            confidence: scanResult.confidence,
            textLength: scanResult.text.length,
            preprocessingApplied: scanResult.preprocessingApplied
        });

        return {
            ...scanResult,
            processingTime,
            mimeType,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ שגיאה כללית בסריקת החשבונית:', error);

        return {
            text: '',
            confidence: 0,
            preprocessingApplied: false,
            error: error.message,
            processingTime,
            mimeType,
            timestamp: new Date().toISOString(),
            fallback: true
        };
    }
}

/**
 * מחזיר מידע על מצב ה-Vision API
 * @returns {Object} - מידע על המצב
 */
export function getVisionApiStatus() {
    try {
        const credentials = getCredentials();
        return {
            available: true,
            projectId: credentials.project_id,
            clientEmail: credentials.client_email,
            message: 'Vision API זמין'
        };
    } catch (error) {
        return {
            available: false,
            error: error.message,
            message: 'Vision API לא זמין - נדרש הגדרת GOOGLE_APPLICATION_CREDENTIALS'
        };
    }
}

/**
 * מבצע בדיקה מהירה של ה-Vision API
 * @returns {Promise<Object>} - תוצאות הבדיקה
 */
export async function testVisionApi() {
    try {
        console.log('🧪 מבצע בדיקת Vision API...');

        // יצירת תמונה פשוטה לבדיקה
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        const result = await scanImageWithVision(testImageBuffer, { usePreprocessing: false });

        return {
            success: true,
            message: 'Vision API פועל תקין',
            confidence: result.confidence,
            testResult: result
        };
    } catch (error) {
        return {
            success: false,
            message: `Vision API לא פועל: ${error.message}`,
            error: error.message
        };
    }
}
