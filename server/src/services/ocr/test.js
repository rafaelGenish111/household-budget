/**
 * קובץ בדיקה למערכת OCR המשופרת
 * כולל בדיקות בסיסיות לכל השכבות
 */

import { scanReceipt, getSystemStatus, testSystem } from './index.js';
import { preprocessImage, analyzeImageQuality, getPhotographyTips } from './preprocessor.js';
import { parseReceiptData } from './receiptParser.js';
import { validateReceiptData } from './validator.js';

// דוגמת טקסט לבדיקה
const sampleReceiptText = `
חנות המזון שלי
רחוב הרצל 123, תל אביב
טלפון: 03-1234567
ח.ע.מ: 123456789

תאריך: 15/12/2024

חלב 3%    12.50
לחם לבן   8.90
ביצים (12 יח')   15.00
עגבניות   6.50

סה"כ לתשלום: 42.90

מזומן: 50.00
עודף: 7.10

תודה על הקנייה!
`;

/**
 * בדיקת מערכת OCR מלאה
 */
async function testOCRSystem() {
    console.log('🧪 מתחיל בדיקת מערכת OCR...\n');

    try {
        // בדיקה 1: מצב המערכת
        console.log('1️⃣ בדיקת מצב המערכת:');
        const systemStatus = getSystemStatus();
        console.log('✅ מצב המערכת:', systemStatus);
        console.log('');

        // בדיקה 2: טיפים לצילום
        console.log('2️⃣ טיפים לצילום:');
        const tips = getPhotographyTips();
        console.log('✅ טיפים:', tips);
        console.log('');

        // בדיקה 3: ניתוח טקסט
        console.log('3️⃣ בדיקת ניתוח טקסט:');
        const parsedData = parseReceiptData(sampleReceiptText);
        console.log('✅ נתונים שנחלצו:', {
            date: parsedData.date?.toLocaleDateString('he-IL'),
            total: parsedData.total,
            businessName: parsedData.businessName,
            itemsCount: parsedData.itemsCount,
            itemsTotal: parsedData.itemsTotal
        });
        console.log('');

        // בדיקה 4: אימות נתונים
        console.log('4️⃣ בדיקת אימות נתונים:');
        const validation = validateReceiptData(parsedData);
        console.log('✅ תוצאות אימות:', {
            isValid: validation.isValid,
            confidence: `${(validation.confidence * 100).toFixed(1)}%`,
            issuesCount: validation.issues.length,
            warningsCount: validation.warnings.length
        });
        console.log('');

        // בדיקה 5: בדיקה מהירה של המערכת
        console.log('5️⃣ בדיקה מהירה של המערכת:');
        const testResult = await testSystem();
        console.log('✅ תוצאות בדיקה:', testResult);
        console.log('');

        console.log('🎉 כל הבדיקות הושלמו בהצלחה!');

    } catch (error) {
        console.error('❌ שגיאה בבדיקת המערכת:', error);
    }
}

/**
 * בדיקת עיבוד מקדים של תמונה
 */
async function testImagePreprocessing() {
    console.log('🖼️ בדיקת עיבוד מקדים של תמונה...\n');

    try {
        // יצירת תמונה פשוטה לבדיקה (1x1 פיקסל לבן)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        // בדיקת ניתוח איכות
        console.log('1️⃣ ניתוח איכות תמונה:');
        const quality = await analyzeImageQuality(testImageBuffer);
        console.log('✅ ניתוח איכות:', quality.quality);
        console.log('');

        // בדיקת עיבוד מקדים
        console.log('2️⃣ עיבוד מקדים:');
        const preprocessingResult = await preprocessImage(testImageBuffer);
        console.log('✅ עיבוד מקדים הושלם:', {
            originalSize: preprocessingResult.originalBuffer.length,
            processedSize: preprocessingResult.processedBuffer.length,
            metadata: preprocessingResult.metadata
        });
        console.log('');

        console.log('🎉 בדיקת עיבוד מקדים הושלמה!');

    } catch (error) {
        console.error('❌ שגיאה בבדיקת עיבוד מקדים:', error);
    }
}

/**
 * בדיקת ניתוח חשבוניות
 */
function testReceiptParsing() {
    console.log('📄 בדיקת ניתוח חשבוניות...\n');

    const testCases = [
        {
            name: 'חשבונית ישראלית בסיסית',
            text: `
                סופרמרקט רמי לוי
                רחוב הרצל 123
                ח.ע.מ: 123456789
                
                תאריך: 15/12/2024
                
                חלב 3%    12.50
                לחם לבן   8.90
                
                סה"כ לתשלום: 21.40
            `
        },
        {
            name: 'חשבונית עם פריטים מרובים',
            text: `
                חנות המזון שלי
                
                01/01/2025
                
                עגבניות   6.50
                מלפפונים   4.20
                בצל   3.80
                שום   2.10
                פטרוזיליה   1.50
                
                סך הכל: 18.10
            `
        },
        {
            name: 'חשבונית עם תאריך עברי',
            text: `
                חנות כלבו
                
                15 בחודש 12 2024
                
                חולצה   89.90
                מכנסיים   120.00
                
                סה"כ: 209.90
            `
        }
    ];

    testCases.forEach((testCase, index) => {
        console.log(`${index + 1}️⃣ ${testCase.name}:`);
        try {
            const parsedData = parseReceiptData(testCase.text);
            console.log('✅ תוצאות:', {
                date: parsedData.date?.toLocaleDateString('he-IL') || 'לא זוהה',
                total: parsedData.total ? `₪${parsedData.total.toFixed(2)}` : 'לא זוהה',
                businessName: parsedData.businessName,
                itemsCount: parsedData.itemsCount
            });
        } catch (error) {
            console.error('❌ שגיאה:', error.message);
        }
        console.log('');
    });

    console.log('🎉 בדיקת ניתוח חשבוניות הושלמה!');
}

/**
 * הרצת כל הבדיקות
 */
async function runAllTests() {
    console.log('🚀 מתחיל בדיקות מקיפות של מערכת OCR...\n');
    console.log('='.repeat(50));
    console.log('');

    await testOCRSystem();
    console.log('\n' + '='.repeat(50) + '\n');

    await testImagePreprocessing();
    console.log('\n' + '='.repeat(50) + '\n');

    testReceiptParsing();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('🎉 כל הבדיקות הושלמו!');
}

// הרצה אם הקובץ נקרא ישירות
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export {
    testOCRSystem,
    testImagePreprocessing,
    testReceiptParsing,
    runAllTests
};
