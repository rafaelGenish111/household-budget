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
            .filter((n) => !isNaN(n) && n > 0 && n < 100000); // סכום מקסימלי סביר לקבלה

    // מילות מפתח שמעידות שזה לא סכום אלא מספר אחר (עסק, כרטיס, וכו')
    const excludeKeywords = [
        'מספר עסק', 'מספר כרטיס', 'מספר מסוף', 'מספר אישור', 'מספר מנפיק',
        'מספר שרבר', 'מספר עוסק', 'ח.ע.מ', 'ע.מ', 'מספר חשבון',
        'מספר אישור', 'מספר אישרר', 'מספר אישור מנפיק',
        'account number', 'card number', 'terminal number', 'merchant number',
        'business number', 'transaction number', 'approval number'
    ];

    // פונקציה לבדיקה אם מספר נראה כמו סכום או כמו מספר עסק/כרטיס
    const isLikelyAmount = (amount, line) => {
        const lowerLine = line.toLowerCase();

        // אם השורה מכילה מילות מפתח של מספרים לא-רלוונטיים - דחה
        if (excludeKeywords.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
            return false;
        }

        // סכומים סבירים לקבלות (עד 50,000 ש"ח)
        if (amount > 50000) return false;

        // סכומים חיוביים בלבד
        if (amount <= 0) return false;

        // בדיקה אם יש נקודה עשרונית בשורה המקורית (סביר יותר שזה סכום)
        const hasDecimalPoint = line.includes('.') && /\d+\.\d{2}/.test(line);
        if (hasDecimalPoint) return true;

        // מספרים ארוכים מאוד (יותר מ-6 ספרות) ללא נקודה עשרונית - כנראה לא סכום
        if (amount >= 1000000 && !line.includes('.')) return false;

        // מספרים עם יותר מ-6 ספרות ללא נקודה עשרונית - כנראה מספר עסק/כרטיס
        const amountStr = amount.toString();
        if (amountStr.length > 6 && !line.includes('.')) return false;

        return true;
    };

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

    // מילות מפתח לסכום ששולם - הוסף patterns מפורשים יותר
    const paidKeywords = [
        'שולם', 'מזומן', 'אשראי', 'כרטיס', 'שילם',
        'paid', 'cash', 'credit', 'card', 'שולם ב'
    ];

    // Pattern ספציפי לזיהוי "שולם: 64.20" או "שולם 64.20"
    const paidPattern = /שולם\s*[:]?\s*([0-9,]+\.?\d{0,2})/i;

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
            // סנן רק סכומים סבירים
            const validAmounts = amountsHere.filter(amt => isLikelyAmount(amt, lines[i]));
            let amt = validAmounts.length > 0 ? validAmounts[validAmounts.length - 1] : null;

            // אם לא נמצא סכום בשורה הנוכחית, בדוק בשורה הבאה
            if (amt == null && i + 1 < lines.length) {
                const nextAmts = parseAmounts(lines[i + 1]);
                const validNextAmounts = nextAmts.filter(amt => isLikelyAmount(amt, lines[i + 1]));
                if (validNextAmounts.length > 0) amt = validNextAmounts[validNextAmounts.length - 1];
            }

            if (amt != null) {
                candidateTotal = amt;
                totalConfidence = 0.9; // ביטחון גבוה למילות מפתח מפורשות
                console.log(`💰 סכום כולל זוהה: ₪${amt} (${totalKeywordFound})`);
            }
        }

        // זיהוי סכום ששולם - עדיפות גבוהה מאוד!
        // קודם כל, נסה pattern מפורש "שולם: 64.20"
        const paidMatch = lines[i].match(paidPattern);
        if (paidMatch) {
            const paidAmount = parseFloat(paidMatch[1].replace(/,/g, ''));
            if (!isNaN(paidAmount) && paidAmount > 0 && paidAmount < 10000) {
                paidMax = paidMax == null ? paidAmount : Math.max(paidMax, paidAmount);
                console.log(`💳 סכום ששולם זוהה מפורש: ₪${paidAmount}`);
            }
        }

        // אחרת, נסה זיהוי רגיל לפי מילות מפתח
        if (paidKeywords.some((k) => line.includes(k))) {
            // סנן רק סכומים סבירים
            const validAmounts = amountsHere.filter(amt => isLikelyAmount(amt, lines[i]));

            if (validAmounts.length > 0) {
                // עדיפות לסכום עם נקודה עשרונית
                const withDecimal = validAmounts.filter(amt => {
                    const amtStr = amt.toString();
                    return amtStr.includes('.') && amtStr.split('.')[1]?.length === 2;
                });

                const finalAmounts = withDecimal.length > 0 ? withDecimal : validAmounts;

                // אם יש "שולם:" או "שולם" מפורש, קח את הסכום הראשון/האחרון (תלוי במיקום)
                // בדרך כלל הסכום מופיע מיד אחרי המילה "שולם"
                let selectedAmount;
                if (line.includes('שולם:') || line.includes('שולם')) {
                    // קח את הסכום האחרון בשורה (בדרך כלל הסכום הוא בצד ימין)
                    selectedAmount = finalAmounts[finalAmounts.length - 1];
                } else {
                    // קח את המקסימלי
                    selectedAmount = Math.max(...finalAmounts);
                }

                // עדכן רק אם הסכום הגיוני (קטן מ-10,000 בדרך כלל)
                if (selectedAmount < 10000 || (paidMax == null && selectedAmount < 50000)) {
                    paidMax = paidMax == null ? selectedAmount : Math.max(paidMax, selectedAmount);
                    console.log(`💳 סכום ששולם זוהה: ₪${selectedAmount}`);
                }
            }
        }

        // זיהוי עודף
        if (changeKeywords.some((k) => line.includes(k))) {
            // סנן רק סכומים סבירים
            const validAmounts = amountsHere.filter(amt => isLikelyAmount(amt, lines[i]));
            if (validAmounts.length > 0) {
                const localMax = Math.max(...validAmounts);
                changeAmt = localMax;
                console.log(`🔄 עודף זוהה: ₪${localMax}`);
            }
        }
    }

    // לוגיקה לקביעת הסכום הסופי
    // עדיפות ראשונה: סכום ששולם (שולם: 64.20) - זהו הסכום המדויק ביותר
    if (paidMax != null) {
        console.log(`✅ משתמש בסכום ששולם: ₪${paidMax}`);
        return round2(paidMax);
    }

    // עדיפות שנייה: סכום כולל מפורש (סה"כ לתשלום)
    if (candidateTotal != null) {
        console.log(`✅ משתמש בסכום כולל מזוהה: ₪${candidateTotal}`);
        return round2(candidateTotal);
    }

    // עדיפות שלישית: חישוב לפי שולם ועודף (אם paidMax לא נמצא מעל)
    // (זה כבר מטופל למעלה אם paidMax קיים)

    // fallback: קח את הסכום הגבוה ביותר שקטן או שווה לסכום ששולם
    // חשוב: סנן מספרים שנראים כמו מספרי עסק/כרטיס
    const allAmounts = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const amountsHere = parseAmounts(line);
        // סנן רק סכומים סבירים
        const validAmounts = amountsHere.filter(amt => isLikelyAmount(amt, line));
        allAmounts.push(...validAmounts);
    }

    if (allAmounts.length) {
        if (paidMax != null) {
            // עדיפות לסכומים שקטנים או שווים לסכום ששולם
            const candidates = allAmounts.filter((n) => n <= paidMax + 0.01);
            if (candidates.length) {
                // אם יש כמה מועמדים, עדיפות לסכומים עם נקודה עשרונית
                const withDecimal = candidates.filter(n => {
                    const lineIndex = lines.findIndex(line =>
                        parseAmounts(line).includes(n) && line.includes('.')
                    );
                    return lineIndex !== -1;
                });

                const finalCandidates = withDecimal.length > 0 ? withDecimal : candidates;
                const maxCandidate = Math.max(...finalCandidates);
                console.log(`🎯 סכום מקסימלי מתאים: ₪${maxCandidate}`);
                return round2(maxCandidate);
            }
        }

        // אם אין סכום ששולם, עדיפות לסכומים עם נקודה עשרונית וקטנים מ-500
        // (רוב הקבלות הן פחות מ-500 ש"ח)
        const reasonableAmounts = allAmounts.filter(n => {
            const lineIndex = lines.findIndex(line =>
                parseAmounts(line).includes(n)
            );
            if (lineIndex === -1) return false;
            const line = lines[lineIndex];
            // עדיפות לסכומים עם נקודה עשרונית
            const hasDecimal = line.includes('.') && /\d+\.\d{2}/.test(line);
            // וקטנים מ-500 (יותר סבירים לקבלות יומיומיות)
            return hasDecimal && n < 500;
        });

        if (reasonableAmounts.length > 0) {
            const maxAmount = Math.max(...reasonableAmounts);
            console.log(`📊 סכום מקסימלי סביר: ₪${maxAmount}`);
            return round2(maxAmount);
        }

        // אם אין סכומים עם נקודה עשרונית קטנים מ-500, חפש עד 1000
        const mediumAmounts = allAmounts.filter(n => {
            const lineIndex = lines.findIndex(line =>
                parseAmounts(line).includes(n)
            );
            if (lineIndex === -1) return false;
            const line = lines[lineIndex];
            const hasDecimal = line.includes('.') && /\d+\.\d{2}/.test(line);
            return hasDecimal && n < 1000;
        });

        if (mediumAmounts.length > 0) {
            const maxAmount = Math.max(...mediumAmounts);
            console.log(`📊 סכום מקסימלי בינוני: ₪${maxAmount}`);
            return round2(maxAmount);
        }

        // אם אין סכומים עם נקודה עשרונית, קח את המקסימלי הקטן מ-1000
        const smallAmounts = allAmounts.filter(n => n < 1000);
        if (smallAmounts.length > 0) {
            const maxAmount = Math.max(...smallAmounts);
            console.log(`📊 סכום מקסימלי קטן: ₪${maxAmount}`);
            return round2(maxAmount);
        }

        // רק אם אין שום דבר אחר, קח את המקסימלי הקטן מ-5000
        const fallbackAmounts = allAmounts.filter(n => n < 5000);
        if (fallbackAmounts.length > 0) {
            const maxAmount = Math.max(...fallbackAmounts);
            console.log(`📊 סכום מקסימלי fallback: ₪${maxAmount}`);
            return round2(maxAmount);
        }

        // רק באמת אחרון, קח את המקסימלי הכללי
        const maxAmount = Math.max(...allAmounts);
        console.log(`⚠️ סכום מקסימלי כללי (אחרון): ₪${maxAmount}`);
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
