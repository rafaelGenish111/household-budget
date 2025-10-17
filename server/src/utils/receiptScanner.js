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
    // שלב 1: חפש סכום מפורש עם מילות מפתח
    const totalPatterns = [
        /(?:סה["']כ|סך הכל|סכום לתשלום|total|לתשלום|סופי|לשלם|כולל|sum|סה"כ|סה״כ)[\s:]*([0-9,]+\.?\d{0,2})/gi,
    ];

    for (const pattern of totalPatterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
            const amounts = matches
                .map((m) => parseFloat(m[1].replace(/,/g, '')))
                .filter((n) => !isNaN(n) && n > 0);
            
            if (amounts.length > 0) {
                return Math.max(...amounts);
            }
        }
    }

    // שלב 2: אם לא נמצא סכום מפורש - ניתוח חכם
    const lines = text.split('\n');
    const candidates = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // חפש מספרים עם בדיוק 2 ספרות אחרי נקודה
        const numbersInLine = line.match(/\d+\.\d{2}/g);
        
        if (!numbersInLine) continue;

        for (const numStr of numbersInLine) {
            const amount = parseFloat(numStr);
            
            // סינון ראשוני - רק סכומים סבירים
            if (amount <= 0 || amount > 100000) continue;
            
            // חשב ציון (score) למספר הזה
            let score = 0;
            
            // 1. בדוק מיקום אופקי - האם זה בצד ימין של השורה?
            const numIndex = line.indexOf(numStr);
            const lineLength = line.trim().length;
            const relativePosition = numIndex / Math.max(lineLength, 1);
            
            // אם המספר בצד ימין (70% מהשורה ומעלה) - נקודות גבוהות
            if (relativePosition > 0.7) {
                score += 50;
            } else if (relativePosition > 0.5) {
                score += 20;
            } else {
                // אם המספר בצד שמאל - ציון נמוך מאוד
                score -= 30;
            }
            
            // 2. בדוק אם השורה מכילה מילות מפתח רלוונטיות
            const lowerLine = line.toLowerCase();
            if (/(?:סה["']כ|סך|total|לתשלום|סופי|כולל)/i.test(lowerLine)) {
                score += 100; // ציון מאוד גבוה
            }
            
            // 3. בדוק אם זה בחלק התחתון של הקבלה (שורות אחרונות)
            const relativeLinePosition = i / Math.max(lines.length, 1);
            if (relativeLinePosition > 0.7) {
                score += 30; // סכומים כוללים בדרך כלל בתחתית
            }
            
            // 4. גודל המספר - סכומים גבוהים יותר נוטים להיות הסכום הכולל
            if (amount > 50) {
                score += 20;
            }
            if (amount > 100) {
                score += 10;
            }
            
            // 5. דחה מספרים שנראים כמו מספר חבר מועדון או מספר כרטיס
            // מספרי חבר מועדון בדרך כלל ארוכים (6+ ספרות) או מופיעים עם תוויות מסוימות
            if (/(?:חבר|מועדון|כרטיס|card|member|#)/i.test(line)) {
                score -= 100; // דחייה חזקה
            }
            
            // אם המספר הוא בדיוק 2 ספרות לפני הנקודה ו-2 אחרי - יכול להיות סכום
            const parts = numStr.split('.');
            if (parts[0].length <= 2) {
                score -= 20; // סכומים קטנים מאוד - ציון נמוך יותר
            }
            
            candidates.push({
                amount,
                score,
                line: line.trim(),
                lineIndex: i,
            });
        }
    }

    // שלב 3: בחר את המועמד הטוב ביותר
    if (candidates.length === 0) {
        return null;
    }

    // מיין לפי ציון (גבוה לנמוך)
    candidates.sort((a, b) => b.score - a.score);

    // החזר את המועמד עם הציון הגבוה ביותר, רק אם הציון חיובי
    const best = candidates[0];
    if (best.score > 0) {
        return best.amount;
    }

    // אם כל הציונים שליליים - החזר את הסכום הגבוה ביותר מבין המועמדים
    const maxAmount = Math.max(...candidates.map((c) => c.amount));
    return maxAmount > 0 ? maxAmount : null;
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

