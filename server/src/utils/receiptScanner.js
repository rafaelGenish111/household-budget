// 🚀 Google Cloud Vision API עם Fallback חכם + תמיכה ב-PDF
import vision from '@google-cloud/vision';
import fs from 'fs';
// טעינת pdf-parse תתבצע דינמית רק כשנזהה PDF
// זאת כדי למנוע שגיאות ייבוא בסביבת Serverless של Vercel
async function getPdfParse() {
    // Polyfills מינימליים שה-pdfjs (תלות של pdf-parse) מצפה להם בסביבת Node
    if (typeof globalThis.DOMMatrix === 'undefined') {
        globalThis.DOMMatrix = class {};
    }
    if (typeof globalThis.Path2D === 'undefined') {
        globalThis.Path2D = class {};
    }
    if (typeof globalThis.ImageData === 'undefined') {
        globalThis.ImageData = class {};
    }

    const mod = await import('pdf-parse');
    return mod.default || mod;
}

// סורק חשבונית (תמונה או PDF) - ינסה Google Cloud Vision, אם לא זמין יעבוד במצב בסיסי
export async function scanReceipt(fileBuffer, mimeType = 'image/jpeg') {
    try {
        console.log('🔍 מנסה לסרוק עם Google Cloud Vision...');
        console.log('🔧 משתנה סביבה GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
        console.log('📁 קובץ קיים?', fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || ''));

        // קריאת מפתחות (מקובץ או ממשתנה סביבה)
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
        console.log('📄 סוג קובץ:', mimeType);

        let text = '';

        // אם זה PDF, נסה לחלץ טקסט ישירות
        if (mimeType === 'application/pdf') {
            console.log('📄 מזהה PDF - מנסה לחלץ טקסט...');
            try {
                const pdfParse = await getPdfParse();
                const pdfData = await pdfParse(fileBuffer);
                text = pdfData.text;
                console.log('✅ טקסט חולץ מ-PDF בהצלחה!');
                
                if (!text || text.trim().length === 0) {
                    console.log('⚠️ PDF ריק או לא קריא');
                    return getBasicScan();
                }
            } catch (pdfError) {
                console.error('❌ שגיאה בחילוץ טקסט מ-PDF:', pdfError.message);
                return getBasicScan();
            }
        } else {
            // תמונה - השתמש ב-Vision API
            const client = new vision.ImageAnnotatorClient({
                projectId: credentials.project_id,
                credentials: credentials,
            });
            const [result] = await client.textDetection(fileBuffer);
            const detections = result.textAnnotations;

            if (!detections || detections.length === 0) {
                console.log('⚠️ לא זוהה טקסט בתמונה');
                return getBasicScan();
            }

            text = detections[0].description;
            console.log('✅ Google Cloud Vision זיהה טקסט בהצלחה!');
        }

        const extractedData = {
            date: extractDate(text),
            total: extractTotal(text),
            businessName: extractBusinessName(text),
            items: extractItems(text),
            rawText: text,
            confidence: calculateConfidence(text),
        };

        console.log('✅ ניתוח הושלם:', {
            date: extractedData.date,
            total: extractedData.total,
            businessName: extractedData.businessName,
            itemsCount: extractedData.items.length,
            confidence: `${(extractedData.confidence * 100).toFixed(0)}%`
        });

        return extractedData;

    } catch (error) {
        console.error('❌ שגיאה ב-Google Cloud Vision:', error.message);
        console.error('🔍 פרטי השגיאה:', {
            code: error.code,
            status: error.status,
            message: error.message,
            details: error.details
        });

        // אם יש שגיאת הרשאות או Billing, עבור למצב בסיסי
        if (error.code === 7 ||
            error.code === 'PERMISSION_DENIED' ||
            error.message.includes('PERMISSION_DENIED') ||
            error.message.includes('billing') ||
            error.message.includes('API not enabled')) {
            console.log('⚠️ Google Cloud Vision לא זמין (צריך להפעיל Billing/API)');
            console.log('📝 עובר למצב בסיסי - תצטרך למלא ידנית');
            return getBasicScan();
        }

        console.error('❌ שגיאה בסריקת החשבונית:', error.message);
        throw new Error('שגיאה בסריקת החשבונית: ' + error.message);
    }
}

// פונקציה למצב בסיסי (ללא Vision API)
function getBasicScan() {
    console.log('📝 מצב בסיסי - החשבונית נשמרת, תמלא את הפרטים ידנית');
    return {
        date: new Date(),
        total: null,
        businessName: 'מלא ידנית',
        items: [],
        rawText: 'מצב בסיסי - Vision API לא זמין',
        confidence: 0.0,
        message: 'Vision API לא זמין. אנא מלא את הפרטים ידנית. להפעלת Vision API: 1) הפעל Billing 2) הפעל Vision API 3) המתן 5-10 דקות',
    };
}

function extractDate(text) {
    const patterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let day, month, year;

            if (match[1].length === 4) {
                [, year, month, day] = match;
            } else {
                [, day, month, year] = match;
            }

            if (year.length === 2) {
                year = '20' + year;
            }

            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }

    return new Date();
}

function extractTotal(text) {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.replace(/[₪\s]+/g, ' ').trim())
        .filter(Boolean);

    const parseAmounts = (s) =>
        (s.match(/\d{1,3}(?:[\,']\d{3})*\.?\d{2}|\d+\.\d{2}/g) || [])
            .map((x) => parseFloat(x.replace(/[,']/g, '')))
            .filter((n) => !isNaN(n));

    const totalKeywords = [
        'סה"כ לתשלום',
        'סה\"כ לתשלום',
        'סכום לתשלום',
        'לתשלום',
        'סכום סופי',
        'total',
        'grand total',
        'balance due',
    ];
    const paidKeywords = ['שולם', 'מזומן', 'אשראי', 'כרטיס', 'שילם', 'paid', 'cash', 'credit'];
    const changeKeywords = ['עודף', 'החזר', 'change'];

    let candidateTotal = null;
    let paidMax = null;
    let changeAmt = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        const amountsHere = parseAmounts(lines[i]);

        // total by keywords (prefer last occurrence)
        if (totalKeywords.some((k) => line.includes(k))) {
            let amt = amountsHere.length > 0 ? amountsHere[amountsHere.length - 1] : null;
            if (amt == null && i + 1 < lines.length) {
                const nextAmts = parseAmounts(lines[i + 1]);
                if (nextAmts.length > 0) amt = nextAmts[nextAmts.length - 1];
            }
            if (amt != null) candidateTotal = amt; // keep last seen
        }

        // paid amount
        if (paidKeywords.some((k) => line.includes(k))) {
            const localMax = amountsHere.length > 0 ? Math.max(...amountsHere) : null;
            if (localMax != null) paidMax = paidMax == null ? localMax : Math.max(paidMax, localMax);
        }

        // change amount (עודף)
        if (changeKeywords.some((k) => line.includes(k))) {
            const localMax = amountsHere.length > 0 ? Math.max(...amountsHere) : null;
            if (localMax != null) changeAmt = localMax;
        }
    }

    // אם זוהה סכום לתשלום מפורש – החזר אותו, ובמידה ויש סכום שולם גדול ממנו, אשר אותו
    if (candidateTotal != null) {
        if (paidMax != null && candidateTotal > paidMax) {
            // OCR טעה – קח את המינימום ביניהם
            return Math.min(candidateTotal, paidMax);
        }
        return candidateTotal;
    }

    // אם אין total מפורש אבל יש שולם ועודף – חשב total = paid - change
    if (paidMax != null && changeAmt != null) {
        const computed = paidMax - changeAmt;
        if (computed > 0) return round2(computed);
    }

    // fallback: אם יש כמה סכומים – קח את הגדול ביותר שקטן או שווה לסכום ששולם
    const allAmounts = parseAmounts(text);
    if (allAmounts.length) {
        if (paidMax != null) {
            const candidates = allAmounts.filter((n) => n <= paidMax + 0.01);
            if (candidates.length) return Math.max(...candidates);
        }
        return Math.max(...allAmounts);
    }

    return null;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

function extractBusinessName(text) {
    const lines = text.split('\n').filter((l) => l.trim());
    const skipWords = ['קבלה', 'חשבונית', 'receipt', 'invoice', 'ח.ח', 'ע.מ', 'מס'];

    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();
        if (
            line.length > 2 &&
            !skipWords.some((w) => line.toLowerCase().includes(w.toLowerCase())) &&
            !line.match(/^\d/) &&
            !line.match(/^[\d\s\.\-\/]+$/)
        ) {
            return line;
        }
    }

    return lines[0] || 'לא זוהה';
}

function extractItems(text) {
    const lines = text.split('\n');
    const items = [];
    const itemPattern = /^(.+?)\s+(\d+\.?\d{0,2})\s*$/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 3) continue;

        const match = trimmed.match(itemPattern);
        if (match) {
            const price = parseFloat(match[2]);
            if (price > 0 && price < 10000) {
                items.push({
                    name: match[1].trim(),
                    price: price,
                });
            }
        }
    }

    return items;
}

function calculateConfidence(text) {
    let score = 0;

    if (extractDate(text)) score += 0.3;
    if (extractTotal(text)) score += 0.4;
    if (extractBusinessName(text) !== 'לא זוהה') score += 0.3;

    return Math.min(score, 1.0);
}

export function detectCategory(businessName) {
    const name = businessName.toLowerCase();

    const categoryKeywords = {
        מזון: [
            'סופרמרקט',
            'שוק',
            'מכולת',
            'רמי לוי',
            'שופרסל',
            'מגה',
            'ויקטורי',
            'יינות ביתן',
            'טיב טעם',
            'עדן טבע',
            'יוחננוף',
        ],
        תחבורה: ['דלק', 'סונול', 'פז', 'דור אלון', 'תן ביס', 'דלאור', 'יעקב', 'שלמה סיקסט'],
        'אוכל בחוץ': [
            'מסעדה',
            'קפה',
            'מקדונלד',
            'בורגר',
            'פיצה',
            'סושי',
            'קפה קפה',
            'ארומה',
            'גרג',
            'נמרוד',
        ],
        בילויים: ['קולנוע', 'סינמה', 'פארק', 'בידורית', 'yes פלאנט', 'סינמה סיטי'],
        בריאות: ['פארם', 'סופר פארם', 'ניו פארם', 'בית מרקחת', 'אופטיקה', 'קופת חולים'],
        ביגוד: ['זארה', 'h&m', 'גולף', 'קסטרו', 'פוקס', 'אמריקן איגל', 'מנגו', 'רנואר'],
        חשבונות: ['חשמל', 'מים', 'ארנונה', 'בזק', 'סלקום', 'פרטנר', 'הוט', 'גולן טלקום'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => name.includes(keyword.toLowerCase()))) {
            return category;
        }
    }

    return 'אחר';
}

