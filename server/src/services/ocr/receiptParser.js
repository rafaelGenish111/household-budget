/**
 * מנתח חכם לחשבוניות ישראליות עם תמיכה בעברית ואנגלית
 * כולל זיהוי סכומים, תאריכים, פריטים ומידע על העסק
 */

/**
 * מחלץ תאריך מהטקסט
 * @param {string} text - הטקסט לסריקה
 * @returns {Date|null} - התאריך שנמצא או null
 */
export function extractDate(text) {
    const patterns = [
        // פורמטים ישראליים: DD/MM/YYYY, DD/MM/YY
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        // פורמטים בינלאומיים: YYYY-MM-DD, YYYY/MM/DD
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
        // תאריכים עבריים בסיסיים (דוגמה פשוטה)
        /(\d{1,2})\s*בחודש\s*(\d{1,2})\s*(\d{4})/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let day, month, year;

            if (match[1].length === 4) {
                // פורמט YYYY-MM-DD
                [, year, month, day] = match;
            } else {
                // פורמט DD/MM/YYYY
                [, day, month, year] = match;
            }

            // המרת שנה דו-ספרתית לארבע-ספרתית
            if (year.length === 2) {
                const currentYear = new Date().getFullYear();
                const currentCentury = Math.floor(currentYear / 100) * 100;
                const twoDigitYear = parseInt(year);

                // אם השנה קטנה מ-30, נניח שמדובר בשנה הבאה
                if (twoDigitYear < 30) {
                    year = currentCentury + twoDigitYear;
                } else {
                    year = currentCentury - 100 + twoDigitYear;
                }
            }

            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);

            // בדיקה שהתאריך הגיוני (לא בעתיד ולא יותר מ-10 שנים בעבר)
            const now = new Date();
            const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

            if (!isNaN(date.getTime()) && date <= now && date >= tenYearsAgo) {
                console.log('📅 תאריך זוהה:', date.toLocaleDateString('he-IL'));
                return date;
            }
        }
    }

    console.log('⚠️ לא זוהה תאריך תקף');
    return null;
}

/**
 * מחלץ סכום כולל מהטקסט
 * @param {string} text - הטקסט לסריקה
 * @returns {number|null} - הסכום שנמצא או null
 */
export function extractTotal(text) {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.replace(/[₪\s]+/g, ' ').trim())
        .filter(Boolean);

    // פונקציה לחילוץ סכומים משורה
    const parseAmounts = (s) =>
        (s.match(/\d{1,3}(?:[\,']\d{3})*\.?\d{2}|\d+\.\d{2}|\d+,\d{2}/g) || [])
            .map((x) => parseFloat(x.replace(/[,']/g, '')))
            .filter((n) => !isNaN(n) && n > 0);

    // מילות מפתח לזיהוי סכום כולל
    const totalKeywords = [
        'סה"כ לתשלום',
        'סה\"כ לתשלום',
        'סך הכל לתשלום',
        'סכום לתשלום',
        'לתשלום',
        'סכום סופי',
        'סכום כולל',
        'total',
        'grand total',
        'balance due',
        'amount due',
        'סך הכל',
        'סה"כ',
        'סה\"כ'
    ];

    // מילות מפתח לסכום ששולם
    const paidKeywords = [
        'שולם', 'מזומן', 'אשראי', 'כרטיס', 'שילם',
        'paid', 'cash', 'credit', 'card', 'שולם ב'
    ];

    // מילות מפתח לעודף
    const changeKeywords = ['עודף', 'החזר', 'change', 'refund'];

    let candidateTotal = null;
    let paidMax = null;
    let changeAmt = null;
    let totalConfidence = 0;

    // סריקה שורה אחר שורה
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        const amountsHere = parseAmounts(lines[i]);

        // זיהוי סכום כולל לפי מילות מפתח
        const totalKeywordFound = totalKeywords.find(keyword => line.includes(keyword.toLowerCase()));
        if (totalKeywordFound) {
            let amt = amountsHere.length > 0 ? amountsHere[amountsHere.length - 1] : null;

            // אם לא נמצא סכום בשורה הנוכחית, בדוק בשורה הבאה
            if (amt == null && i + 1 < lines.length) {
                const nextAmts = parseAmounts(lines[i + 1]);
                if (nextAmts.length > 0) amt = nextAmts[nextAmts.length - 1];
            }

            if (amt != null) {
                candidateTotal = amt;
                totalConfidence = 0.9; // ביטחון גבוה למילות מפתח מפורשות
                console.log(`💰 סכום כולל זוהה: ₪${amt} (${totalKeywordFound})`);
            }
        }

        // זיהוי סכום ששולם
        if (paidKeywords.some((k) => line.includes(k))) {
            const localMax = amountsHere.length > 0 ? Math.max(...amountsHere) : null;
            if (localMax != null) {
                paidMax = paidMax == null ? localMax : Math.max(paidMax, localMax);
                console.log(`💳 סכום ששולם זוהה: ₪${localMax}`);
            }
        }

        // זיהוי עודף
        if (changeKeywords.some((k) => line.includes(k))) {
            const localMax = amountsHere.length > 0 ? Math.max(...amountsHere) : null;
            if (localMax != null) {
                changeAmt = localMax;
                console.log(`🔄 עודף זוהה: ₪${localMax}`);
            }
        }
    }

    // לוגיקה לקביעת הסכום הסופי
    if (candidateTotal != null) {
        // אם יש סכום לתשלום מפורש
        if (paidMax != null && candidateTotal > paidMax) {
            // OCR כנראה טעה - קח את המינימום
            const correctedTotal = Math.min(candidateTotal, paidMax);
            console.log(`🔧 תיקון סכום: ₪${candidateTotal} → ₪${correctedTotal}`);
            return round2(correctedTotal);
        }
        return round2(candidateTotal);
    }

    // אם אין total מפורש אבל יש שולם ועודף
    if (paidMax != null && changeAmt != null) {
        const computed = paidMax - changeAmt;
        if (computed > 0) {
            console.log(`🧮 חישוב סכום: ₪${paidMax} - ₪${changeAmt} = ₪${computed}`);
            return round2(computed);
        }
    }

    // fallback: קח את הסכום הגבוה ביותר שקטן או שווה לסכום ששולם
    const allAmounts = parseAmounts(text);
    if (allAmounts.length) {
        if (paidMax != null) {
            const candidates = allAmounts.filter((n) => n <= paidMax + 0.01);
            if (candidates.length) {
                const maxCandidate = Math.max(...candidates);
                console.log(`🎯 סכום מקסימלי מתאים: ₪${maxCandidate}`);
                return round2(maxCandidate);
            }
        }

        const maxAmount = Math.max(...allAmounts);
        console.log(`📊 סכום מקסימלי כללי: ₪${maxAmount}`);
        return round2(maxAmount);
    }

    console.log('⚠️ לא זוהה סכום כולל');
    return null;
}

/**
 * מחלץ שם העסק מהטקסט
 * @param {string} text - הטקסט לסריקה
 * @returns {string} - שם העסק שנמצא
 */
export function extractBusinessName(text) {
    const lines = text.split('\n').filter((l) => l.trim());
    const skipWords = [
        'קבלה', 'חשבונית', 'receipt', 'invoice', 'ח.ח', 'ע.מ', 'מס',
        'תאריך', 'date', 'סכום', 'amount', 'סה"כ', 'total',
        'מזומן', 'אשראי', 'cash', 'credit', 'לתשלום'
    ];

    // חיפוש בשורות הראשונות (עד 5 שורות)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();

        // בדיקות לאיכות השורה
        if (
            line.length > 2 &&
            line.length < 100 && // לא יותר מדי ארוך
            !skipWords.some((w) => line.toLowerCase().includes(w.toLowerCase())) &&
            !line.match(/^\d/) && // לא מתחיל במספר
            !line.match(/^[\d\s\.\-\/]+$/) && // לא רק מספרים וסימנים
            !line.match(/^\s*₪/) && // לא מתחיל בסימן שקל
            line.includes(' ') // מכיל רווח (שם עסק בדרך כלל)
        ) {
            console.log(`🏪 שם עסק זוהה: "${line}"`);
            return line;
        }
    }

    // אם לא נמצא שם טוב, קח את השורה הראשונה הלא-ריקה
    const firstNonEmptyLine = lines.find(line => line.trim().length > 0);
    const businessName = firstNonEmptyLine || 'לא זוהה';

    console.log(`⚠️ שם עסק ברירת מחדל: "${businessName}"`);
    return businessName;
}

/**
 * מחלץ פריטים מהטקסט
 * @param {string} text - הטקסט לסריקה
 * @returns {Array<Object>} - רשימת פריטים
 */
export function extractItems(text) {
    const lines = text.split('\n');
    const items = [];

    // דפוסים שונים לזיהוי פריטים
    const itemPatterns = [
        // דפוס בסיסי: תיאור + מחיר
        /^(.+?)\s+(\d+\.?\d{0,2})\s*$/,
        // דפוס עם כמות: כמות x תיאור + מחיר
        /^(\d+)\s*x\s*(.+?)\s+(\d+\.?\d{0,2})\s*$/,
        // דפוס עם מחיר יחידה: תיאור + מחיר יחידה + כמות
        /^(.+?)\s+(\d+\.?\d{0,2})\s*x\s*(\d+)\s*$/,
        // דפוס עם סימן שקל
        /^(.+?)\s+₪(\d+\.?\d{0,2})\s*$/
    ];

    const skipLines = [
        'סה"כ', 'סה\"כ', 'סך הכל', 'total', 'לתשלום',
        'מזומן', 'אשראי', 'cash', 'credit', 'עודף', 'change'
    ];

    for (const line of lines) {
        const trimmed = line.trim();

        // דלג על שורות קצרות מדי או שורות לא רלוונטיות
        if (trimmed.length < 3 || skipLines.some(skip => trimmed.toLowerCase().includes(skip.toLowerCase()))) {
            continue;
        }

        let item = null;

        // נסה כל דפוס
        for (const pattern of itemPatterns) {
            const match = trimmed.match(pattern);
            if (match) {
                if (pattern.source.includes('x')) {
                    // דפוס עם כמות
                    if (match.length === 4) {
                        // כמות x תיאור + מחיר
                        const quantity = parseInt(match[1]);
                        const description = match[2].trim();
                        const price = parseFloat(match[3]);

                        if (price > 0 && price < 10000 && quantity > 0) {
                            item = {
                                description: `${quantity}x ${description}`,
                                price: price,
                                quantity: quantity,
                                unitPrice: round2(price / quantity)
                            };
                        }
                    } else {
                        // תיאור + מחיר יחידה x כמות
                        const description = match[1].trim();
                        const unitPrice = parseFloat(match[2]);
                        const quantity = parseInt(match[3]);
                        const totalPrice = unitPrice * quantity;

                        if (unitPrice > 0 && unitPrice < 1000 && quantity > 0) {
                            item = {
                                description: `${description} (${quantity}x ₪${unitPrice.toFixed(2)})`,
                                price: round2(totalPrice),
                                quantity: quantity,
                                unitPrice: unitPrice
                            };
                        }
                    }
                } else {
                    // דפוס בסיסי
                    const description = match[1].trim();
                    const price = parseFloat(match[2]);

                    if (price > 0 && price < 10000) {
                        item = {
                            description: description,
                            price: price,
                            quantity: 1,
                            unitPrice: price
                        };
                    }
                }
                break;
            }
        }

        if (item) {
            // בדיקות נוספות לאיכות הפריט
            if (item.description.length > 1 &&
                item.description.length < 100 &&
                !item.description.match(/^\d+$/) && // לא רק מספרים
                !item.description.match(/^[₪\d\s\.\-\/]+$/)) { // לא רק סימנים

                items.push(item);
                console.log(`📦 פריט זוהה: "${item.description}" - ₪${item.price.toFixed(2)}`);
            }
        }
    }

    console.log(`📋 סה"כ פריטים זוהו: ${items.length}`);
    return items;
}

/**
 * מחלץ מידע נוסף על העסק
 * @param {string} text - הטקסט לסריקה
 * @returns {Object} - מידע על העסק
 */
export function extractBusinessInfo(text) {
    const businessInfo = {
        name: extractBusinessName(text),
        taxId: null,
        address: null,
        phone: null,
        email: null
    };

    const lines = text.split('\n');

    // חיפוש ח.ע.מ או ע.מ
    const taxIdPatterns = [
        /ח\.ע\.מ[:\s]*(\d{9})/,
        /ע\.מ[:\s]*(\d{9})/,
        /tax[:\s]*id[:\s]*(\d{9})/i,
        /(\d{9})/
    ];

    for (const pattern of taxIdPatterns) {
        const match = text.match(pattern);
        if (match) {
            businessInfo.taxId = match[1];
            console.log(`🏢 ח.ע.מ זוהה: ${businessInfo.taxId}`);
            break;
        }
    }

    // חיפוש כתובת (דוגמה פשוטה)
    const addressPattern = /([א-ת\s\d]+(?:רחוב|רח|שדרות|שד|כיכר|מרכז|מרכז|מתחם)[א-ת\s\d]+)/;
    const addressMatch = text.match(addressPattern);
    if (addressMatch) {
        businessInfo.address = addressMatch[1].trim();
        console.log(`📍 כתובת זוהה: ${businessInfo.address}`);
    }

    // חיפוש טלפון
    const phonePattern = /(\d{2,3}[- ]?\d{7})/;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) {
        businessInfo.phone = phoneMatch[1];
        console.log(`📞 טלפון זוהה: ${businessInfo.phone}`);
    }

    // חיפוש אימייל
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
        businessInfo.email = emailMatch[1];
        console.log(`📧 אימייל זוהה: ${businessInfo.email}`);
    }

    return businessInfo;
}

/**
 * מנתח את כל הנתונים מהטקסט
 * @param {string} text - הטקסט לסריקה
 * @returns {Object} - כל הנתונים שנחלצו
 */
export function parseReceiptData(text) {
    console.log('🔍 מתחיל ניתוח חשבונית...');

    const parsedData = {
        date: extractDate(text),
        total: extractTotal(text),
        businessInfo: extractBusinessInfo(text),
        items: extractItems(text),
        rawText: text,
        parsedAt: new Date().toISOString()
    };

    // חישוב סטטיסטיקות
    const itemsTotal = parsedData.items.reduce((sum, item) => sum + item.price, 0);
    parsedData.itemsTotal = round2(itemsTotal);
    parsedData.itemsCount = parsedData.items.length;

    console.log('✅ ניתוח הושלם:', {
        date: parsedData.date?.toLocaleDateString('he-IL') || 'לא זוהה',
        total: parsedData.total ? `₪${parsedData.total.toFixed(2)}` : 'לא זוהה',
        businessName: parsedData.businessInfo.name,
        itemsCount: parsedData.itemsCount,
        itemsTotal: `₪${parsedData.itemsTotal.toFixed(2)}`
    });

    return parsedData;
}

/**
 * פונקציה עזר לעיגול למקום עשרוני
 * @param {number} n - המספר לעיגול
 * @returns {number} - המספר המעוגל
 */
function round2(n) {
    return Math.round(n * 100) / 100;
}
