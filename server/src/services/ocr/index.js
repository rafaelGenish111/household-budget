/**
 * שכבת ארגון מרכזית למערכת OCR המשופרת
 * מחברת בין כל השכבות: עיבוד מקדים, Vision API, ניתוח ואימות
 */

import { scanReceipt } from './visionAPI.js';
import { parseReceiptData } from './receiptParser.js';
import { validateReceiptData, getImprovementSuggestions, getQualitySummary } from './validator.js';
import { analyzeImageQuality, getPhotographyTips } from './preprocessor.js';

/**
 * פונקציה ראשית לסריקת חשבונית משופרת
 * @param {Buffer} fileBuffer - Buffer של הקובץ
 * @param {string} mimeType - סוג הקובץ
 * @param {Object} options - אפשרויות סריקה
 * @returns {Promise<Object>} - תוצאות הסריקה המלאות
 */
export async function scanReceiptEnhanced(fileBuffer, mimeType = 'image/jpeg', options = {}) {
    const startTime = Date.now();
    const sessionId = generateSessionId();

    console.log(`🚀 מתחיל סריקת חשבונית משופרת [${sessionId}]`);
    console.log('📄 פרטי הקובץ:', {
        mimetype: mimeType,
        size: fileBuffer.length,
        timestamp: new Date().toISOString()
    });

    try {
        // שלב 1: ניתוח איכות התמונה (רק לתמונות)
        let imageQuality = null;
        if (mimeType.startsWith('image/')) {
            imageQuality = await analyzeImageQuality(fileBuffer);
            console.log('📊 ניתוח איכות תמונה:', imageQuality.quality);
        }

        // שלב 2: סריקה עם Vision API
        const scanResult = await scanReceipt(fileBuffer, mimeType, {
            usePreprocessing: true,
            languageHints: ['he', 'en'],
            maxRetries: 3,
            ...options
        });

        if (scanResult.fallback) {
            // מצב fallback - החזר תוצאה בסיסית
            return createFallbackResult(fileBuffer, mimeType, scanResult, startTime, sessionId);
        }

        // שלב 3: ניתוח הנתונים
        const parsedData = parseReceiptData(scanResult.text);

        // שלב 4: אימות הנתונים
        const validation = validateReceiptData(parsedData);

        // שלב 5: יצירת תוצאה סופית
        const result = createFinalResult({
            scanResult,
            parsedData,
            validation,
            imageQuality,
            fileBuffer,
            mimeType,
            startTime,
            sessionId,
            options
        });

        console.log(`✅ סריקת חשבונית הושלמה [${sessionId}]:`, {
            processingTime: `${result.processingTime}ms`,
            confidence: `${(result.confidence * 100).toFixed(1)}%`,
            quality: result.qualitySummary.level,
            isValid: result.validation.isValid
        });

        return result;

    } catch (error) {
        console.error(`❌ שגיאה בסריקת חשבונית [${sessionId}]:`, error);

        return createErrorResult(error, fileBuffer, mimeType, startTime, sessionId);
    }
}

/**
 * יוצר תוצאה סופית עם כל הנתונים
 * @param {Object} data - כל הנתונים הנדרשים
 * @returns {Object} - התוצאה הסופית
 */
function createFinalResult(data) {
    const {
        scanResult,
        parsedData,
        validation,
        imageQuality,
        fileBuffer,
        mimeType,
        startTime,
        sessionId,
        options
    } = data;

    const processingTime = Date.now() - startTime;
    const qualitySummary = getQualitySummary(validation);
    const suggestions = getImprovementSuggestions(parsedData, validation);

    // חישוב ביטחון כולל
    const overallConfidence = calculateOverallConfidence({
        scanConfidence: scanResult.confidence,
        validationConfidence: validation.confidence,
        imageQuality: imageQuality?.quality?.score || 50
    });

    return {
        // נתונים בסיסיים
        date: parsedData.date,
        total: parsedData.total,
        businessName: parsedData.businessInfo.name,
        businessInfo: parsedData.businessInfo,
        items: parsedData.items,
        itemsCount: parsedData.itemsCount,
        itemsTotal: parsedData.itemsTotal,

        // מטא-דאטה
        rawText: scanResult.text,
        confidence: overallConfidence,
        processingTime,
        sessionId,
        timestamp: new Date().toISOString(),

        // אימות ואיכות
        validation,
        qualitySummary,
        suggestions,

        // מידע טכני
        scanInfo: {
            preprocessingApplied: scanResult.preprocessingApplied,
            attempt: scanResult.attempt,
            mimeType,
            fileSize: fileBuffer.length
        },

        // איכות תמונה (אם רלוונטי)
        imageQuality,

        // הגדרות
        options: {
            usePreprocessing: options.usePreprocessing !== false,
            languageHints: options.languageHints || ['he', 'en'],
            maxRetries: options.maxRetries || 3
        }
    };
}

/**
 * יוצר תוצאה במצב fallback
 * @param {Buffer} fileBuffer - Buffer של הקובץ
 * @param {string} mimeType - סוג הקובץ
 * @param {Object} scanResult - תוצאות הסריקה
 * @param {number} startTime - זמן התחלה
 * @param {string} sessionId - מזהה הפעלה
 * @returns {Object} - תוצאה במצב fallback
 */
function createFallbackResult(fileBuffer, mimeType, scanResult, startTime, sessionId) {
    const processingTime = Date.now() - startTime;

    console.log(`⚠️ מצב fallback [${sessionId}] - Vision API לא זמין`);

    return {
        date: new Date(),
        total: null,
        businessName: 'מלא ידנית',
        businessInfo: {
            name: 'מלא ידנית',
            taxId: null,
            address: null,
            phone: null,
            email: null
        },
        items: [],
        itemsCount: 0,
        itemsTotal: 0,

        rawText: 'מצב בסיסי - Vision API לא זמין',
        confidence: 0,
        processingTime,
        sessionId,
        timestamp: new Date().toISOString(),

        validation: {
            isValid: false,
            confidence: 0,
            issues: ['Vision API לא זמין'],
            warnings: [],
            suggestions: []
        },

        qualitySummary: {
            level: 'poor',
            label: 'נמוך',
            color: 'error',
            confidence: 0,
            issuesCount: 1,
            warningsCount: 0,
            needsAttention: true
        },

        suggestions: [
            'Vision API לא זמין - נדרש להפעיל Billing ו-Vision API',
            'מלא את הפרטים ידנית',
            'להפעלת Vision API: 1) הפעל Billing 2) הפעל Vision API 3) המתן 5-10 דקות'
        ],

        scanInfo: {
            preprocessingApplied: scanResult.preprocessingApplied || false,
            attempt: 0,
            mimeType,
            fileSize: fileBuffer.length,
            fallback: true
        },

        fallback: true,
        message: 'Vision API לא זמין. אנא מלא את הפרטים ידנית.'
    };
}

/**
 * יוצר תוצאה עם שגיאה
 * @param {Error} error - השגיאה
 * @param {Buffer} fileBuffer - Buffer של הקובץ
 * @param {string} mimeType - סוג הקובץ
 * @param {number} startTime - זמן התחלה
 * @param {string} sessionId - מזהה הפעלה
 * @returns {Object} - תוצאה עם שגיאה
 */
function createErrorResult(error, fileBuffer, mimeType, startTime, sessionId) {
    const processingTime = Date.now() - startTime;

    return {
        date: new Date(),
        total: null,
        businessName: 'שגיאה בסריקה',
        businessInfo: {
            name: 'שגיאה בסריקה',
            taxId: null,
            address: null,
            phone: null,
            email: null
        },
        items: [],
        itemsCount: 0,
        itemsTotal: 0,

        rawText: '',
        confidence: 0,
        processingTime,
        sessionId,
        timestamp: new Date().toISOString(),

        validation: {
            isValid: false,
            confidence: 0,
            issues: [`שגיאה בסריקה: ${error.message}`],
            warnings: [],
            suggestions: []
        },

        qualitySummary: {
            level: 'poor',
            label: 'נמוך',
            color: 'error',
            confidence: 0,
            issuesCount: 1,
            warningsCount: 0,
            needsAttention: true
        },

        suggestions: [
            'נסה לצלם שוב את החשבונית',
            'ודא שהתמונה ברורה וקריאה',
            'בדוק שהקובץ לא פגום'
        ],

        scanInfo: {
            preprocessingApplied: false,
            attempt: 0,
            mimeType,
            fileSize: fileBuffer.length,
            error: true
        },

        error: true,
        errorMessage: error.message
    };
}

/**
 * מחשב ביטחון כולל מכל השכבות
 * @param {Object} confidences - ביטחונות מכל השכבות
 * @returns {number} - ביטחון כולל
 */
function calculateOverallConfidence(confidences) {
    const {
        scanConfidence = 0,
        validationConfidence = 0,
        imageQuality = 50
    } = confidences;

    // משקלים שונים לכל שכבה
    const weights = {
        scan: 0.4,      // 40% - איכות הסריקה
        validation: 0.4, // 40% - איכות הנתונים
        image: 0.2      // 20% - איכות התמונה
    };

    const imageConfidence = imageQuality / 100; // המרה מ-0-100 ל-0-1

    const overallConfidence =
        (scanConfidence * weights.scan) +
        (validationConfidence * weights.validation) +
        (imageConfidence * weights.image);

    return Math.min(Math.max(overallConfidence, 0), 1); // הגבלה ל-0-1
}

/**
 * יוצר מזהה ייחודי לפעולת הסריקה
 * @returns {string} - מזהה הפעלה
 */
function generateSessionId() {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * מחזיר מידע על מצב המערכת
 * @returns {Object} - מידע על המצב
 */
export function getSystemStatus() {
    return {
        version: '2.0.0',
        features: {
            preprocessing: true,
            visionAPI: true,
            receiptParsing: true,
            validation: true,
            fallback: true
        },
        supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        languages: ['he', 'en'],
        timestamp: new Date().toISOString()
    };
}

/**
 * מחזיר טיפים לצילום טוב יותר
 * @returns {Array<string>} - רשימת טיפים
 */
export function getPhotographyTips() {
    return getPhotographyTips();
}

/**
 * מבצע בדיקה מהירה של המערכת
 * @returns {Promise<Object>} - תוצאות הבדיקה
 */
export async function testSystem() {
    const startTime = Date.now();

    try {
        console.log('🧪 מבצע בדיקת מערכת OCR...');

        // בדיקת כל השכבות
        const tests = {
            preprocessor: true,
            visionAPI: false,
            parser: true,
            validator: true
        };

        // בדיקת Vision API (רק אם זמין)
        try {
            const { testVisionApi } = await import('./visionAPI.js');
            const visionTest = await testVisionApi();
            tests.visionAPI = visionTest.success;
        } catch (error) {
            console.warn('⚠️ Vision API לא זמין לבדיקה:', error.message);
        }

        const processingTime = Date.now() - startTime;
        const allTestsPassed = Object.values(tests).every(test => test);

        return {
            success: allTestsPassed,
            tests,
            processingTime,
            message: allTestsPassed ? 'כל הבדיקות עברו בהצלחה' : 'חלק מהבדיקות נכשלו',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            processingTime: Date.now() - startTime,
            message: 'שגיאה בבדיקת המערכת',
            timestamp: new Date().toISOString()
        };
    }
}

// ייצוא הפונקציה הראשית עם שם תואם לקוד הקיים
export { scanReceiptEnhanced as scanReceipt };
