/**
 * מנגנון אימות נתוני חשבונית עם בדיקות הגיוניות וביטחון
 */

/**
 * מנתח את איכות הנתונים ומחזיר ציון ביטחון
 * @param {Object} receiptData - נתוני החשבונית
 * @returns {Object} - תוצאות האימות
 */
export function validateReceiptData(receiptData) {
    const validation = {
        isValid: true,
        confidence: 0,
        issues: [],
        warnings: [],
        suggestions: []
    };

    console.log('🔍 מתחיל אימות נתוני החשבונית...');

    // בדיקת תאריך
    const dateValidation = validateDate(receiptData.date);
    if (!dateValidation.isValid) {
        validation.issues.push(...dateValidation.issues);
        validation.isValid = false;
    }
    validation.confidence += dateValidation.confidence * 0.2;

    // בדיקת סכום כולל
    const totalValidation = validateTotal(receiptData.total);
    if (!totalValidation.isValid) {
        validation.issues.push(...totalValidation.issues);
        validation.isValid = false;
    }
    validation.confidence += totalValidation.confidence * 0.3;

    // בדיקת פריטים
    const itemsValidation = validateItems(receiptData.items);
    if (!itemsValidation.isValid) {
        validation.issues.push(...itemsValidation.issues);
        validation.isValid = false;
    }
    validation.confidence += itemsValidation.confidence * 0.25;

    // בדיקת שם העסק
    const businessValidation = validateBusiness(receiptData.businessInfo);
    validation.confidence += businessValidation.confidence * 0.15;

    // בדיקת התאמה בין סכום הפריטים לסכום הכולל
    const consistencyValidation = validateConsistency(receiptData);
    if (!consistencyValidation.isValid) {
        validation.warnings.push(...consistencyValidation.warnings);
    }
    validation.confidence += consistencyValidation.confidence * 0.1;

    // הגבלת הביטחון ל-1.0
    validation.confidence = Math.min(validation.confidence, 1.0);

    console.log('✅ אימות הושלם:', {
        isValid: validation.isValid,
        confidence: `${(validation.confidence * 100).toFixed(1)}%`,
        issuesCount: validation.issues.length,
        warningsCount: validation.warnings.length
    });

    return validation;
}

/**
 * בודק את תקינות התאריך
 * @param {Date|null} date - התאריך לבדיקה
 * @returns {Object} - תוצאות הבדיקה
 */
function validateDate(date) {
    const validation = {
        isValid: true,
        confidence: 0,
        issues: []
    };

    if (!date) {
        validation.isValid = false;
        validation.issues.push('לא זוהה תאריך');
        validation.confidence = 0;
        return validation;
    }

    const now = new Date();
    const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    // בדיקת תקינות התאריך
    if (isNaN(date.getTime())) {
        validation.isValid = false;
        validation.issues.push('תאריך לא תקין');
        validation.confidence = 0;
        return validation;
    }

    // בדיקת טווח התאריך
    if (date < tenYearsAgo) {
        validation.isValid = false;
        validation.issues.push('תאריך ישן מדי (יותר מ-10 שנים)');
        validation.confidence = 0.3;
    } else if (date > oneYearFromNow) {
        validation.isValid = false;
        validation.issues.push('תאריך עתידי מדי');
        validation.confidence = 0.3;
    } else {
        validation.confidence = 1.0;
    }

    // בדיקת יום בשבוע (חשבוניות בדרך כלל לא ביום שבת)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 6) { // שבת
        validation.issues.push('חשבונית ביום שבת - בדוק את התאריך');
        validation.confidence *= 0.8;
    }

    return validation;
}

/**
 * בודק את תקינות הסכום הכולל
 * @param {number|null} total - הסכום לבדיקה
 * @returns {Object} - תוצאות הבדיקה
 */
function validateTotal(total) {
    const validation = {
        isValid: true,
        confidence: 0,
        issues: []
    };

    if (!total) {
        validation.isValid = false;
        validation.issues.push('לא זוהה סכום כולל');
        validation.confidence = 0;
        return validation;
    }

    // בדיקת טווח הסכום
    if (total <= 0) {
        validation.isValid = false;
        validation.issues.push('סכום שלילי או אפס');
        validation.confidence = 0;
    } else if (total < 1) {
        validation.isValid = false;
        validation.issues.push('סכום קטן מדי (פחות משקל)');
        validation.confidence = 0.2;
    } else if (total > 50000) {
        validation.isValid = false;
        validation.issues.push('סכום גדול מדי (יותר מ-50,000 ש"ח)');
        validation.confidence = 0.3;
    } else {
        validation.confidence = 1.0;
    }

    // בדיקת עיגול הסכום
    const roundedTotal = Math.round(total * 100) / 100;
    if (Math.abs(total - roundedTotal) > 0.01) {
        validation.issues.push('סכום לא מעוגל נכון');
        validation.confidence *= 0.9;
    }

    return validation;
}

/**
 * בודק את תקינות הפריטים
 * @param {Array} items - רשימת הפריטים
 * @returns {Object} - תוצאות הבדיקה
 */
function validateItems(items) {
    const validation = {
        isValid: true,
        confidence: 0,
        issues: []
    };

    if (!items || !Array.isArray(items)) {
        validation.isValid = false;
        validation.issues.push('רשימת פריטים לא תקינה');
        validation.confidence = 0;
        return validation;
    }

    if (items.length === 0) {
        validation.isValid = false;
        validation.issues.push('לא זוהו פריטים');
        validation.confidence = 0;
        return validation;
    }

    let validItemsCount = 0;
    let totalItemsPrice = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // בדיקת מבנה הפריט
        if (!item.description || !item.price) {
            validation.issues.push(`פריט ${i + 1}: חסרים פרטים`);
            continue;
        }

        // בדיקת תיאור הפריט
        if (item.description.length < 2) {
            validation.issues.push(`פריט ${i + 1}: תיאור קצר מדי`);
            continue;
        }

        if (item.description.length > 100) {
            validation.issues.push(`פריט ${i + 1}: תיאור ארוך מדי`);
            continue;
        }

        // בדיקת מחיר הפריט
        if (item.price <= 0) {
            validation.issues.push(`פריט ${i + 1}: מחיר לא תקין`);
            continue;
        }

        if (item.price > 10000) {
            validation.issues.push(`פריט ${i + 1}: מחיר גבוה מדי`);
            continue;
        }

        validItemsCount++;
        totalItemsPrice += item.price;
    }

    // חישוב ביטחון לפי אחוז הפריטים התקפים
    validation.confidence = validItemsCount / items.length;

    if (validItemsCount === 0) {
        validation.isValid = false;
        validation.issues.push('אין פריטים תקפים');
        validation.confidence = 0;
    } else if (validItemsCount < items.length * 0.5) {
        validation.isValid = false;
        validation.issues.push('יותר מחצי מהפריטים לא תקפים');
        validation.confidence *= 0.5;
    }

    return validation;
}

/**
 * בודק את תקינות מידע העסק
 * @param {Object} businessInfo - מידע העסק
 * @returns {Object} - תוצאות הבדיקה
 */
function validateBusiness(businessInfo) {
    const validation = {
        isValid: true,
        confidence: 0,
        issues: []
    };

    if (!businessInfo || !businessInfo.name) {
        validation.issues.push('לא זוהה שם עסק');
        validation.confidence = 0;
        return validation;
    }

    // בדיקת שם העסק
    if (businessInfo.name === 'לא זוהה') {
        validation.issues.push('שם עסק לא זוהה');
        validation.confidence = 0.2;
    } else if (businessInfo.name.length < 2) {
        validation.issues.push('שם עסק קצר מדי');
        validation.confidence = 0.3;
    } else if (businessInfo.name.length > 100) {
        validation.issues.push('שם עסק ארוך מדי');
        validation.confidence = 0.5;
    } else {
        validation.confidence = 0.8;
    }

    // בדיקת ח.ע.מ
    if (businessInfo.taxId) {
        if (businessInfo.taxId.length === 9 && /^\d{9}$/.test(businessInfo.taxId)) {
            validation.confidence += 0.2;
        } else {
            validation.issues.push('ח.ע.מ לא תקין');
        }
    }

    return validation;
}

/**
 * בודק התאמה בין סכום הפריטים לסכום הכולל
 * @param {Object} receiptData - נתוני החשבונית
 * @returns {Object} - תוצאות הבדיקה
 */
function validateConsistency(receiptData) {
    const validation = {
        isValid: true,
        confidence: 0,
        warnings: []
    };

    if (!receiptData.total || !receiptData.items || receiptData.items.length === 0) {
        validation.confidence = 0;
        return validation;
    }

    const itemsTotal = receiptData.items.reduce((sum, item) => sum + item.price, 0);
    const difference = Math.abs(receiptData.total - itemsTotal);
    const percentageDifference = (difference / receiptData.total) * 100;

    // בדיקת התאמה
    if (percentageDifference < 1) {
        validation.confidence = 1.0;
    } else if (percentageDifference < 5) {
        validation.confidence = 0.8;
        validation.warnings.push(`סכום הפריטים (₪${itemsTotal.toFixed(2)}) שונה מהסכום הכולל (₪${receiptData.total.toFixed(2)}) ב-${percentageDifference.toFixed(1)}%`);
    } else if (percentageDifference < 10) {
        validation.confidence = 0.5;
        validation.warnings.push(`הפרש גדול בין סכום הפריטים לסכום הכולל (${percentageDifference.toFixed(1)}%)`);
    } else {
        validation.confidence = 0.2;
        validation.warnings.push(`הפרש משמעותי בין סכום הפריטים לסכום הכולל (${percentageDifference.toFixed(1)}%) - בדוק את הנתונים`);
    }

    return validation;
}

/**
 * מחזיר המלצות לשיפור הנתונים
 * @param {Object} receiptData - נתוני החשבונית
 * @param {Object} validation - תוצאות האימות
 * @returns {Array<string>} - רשימת המלצות
 */
export function getImprovementSuggestions(receiptData, validation) {
    const suggestions = [];

    // המלצות לפי רמת הביטחון
    if (validation.confidence < 0.5) {
        suggestions.push('רמת הביטחון נמוכה - מומלץ לצלם שוב את החשבונית');
    } else if (validation.confidence < 0.7) {
        suggestions.push('רמת הביטחון בינונית - בדוק את הנתונים לפני שמירה');
    }

    // המלצות לפי בעיות ספציפיות
    if (validation.issues.some(issue => issue.includes('תאריך'))) {
        suggestions.push('ודא שהתאריך בחשבונית קריא וברור');
    }

    if (validation.issues.some(issue => issue.includes('סכום'))) {
        suggestions.push('ודא שהסכום הכולל בחשבונית ברור וקריא');
    }

    if (validation.issues.some(issue => issue.includes('פריטים'))) {
        suggestions.push('ודא שכל הפריטים בחשבונית קריאים וברורים');
    }

    if (validation.warnings.some(warning => warning.includes('הפרש'))) {
        suggestions.push('בדוק שהסכום הכולל תואם לסכום הפריטים');
    }

    // המלצות כלליות
    if (receiptData.items && receiptData.items.length > 20) {
        suggestions.push('חשבונית עם הרבה פריטים - בדוק שכל הפריטים זוהו נכון');
    }

    if (receiptData.total && receiptData.total > 1000) {
        suggestions.push('חשבונית בסכום גבוה - בדוק את כל הפרטים בקפידה');
    }

    return suggestions;
}

/**
 * מחזיר סיכום איכות הנתונים
 * @param {Object} validation - תוצאות האימות
 * @returns {Object} - סיכום האיכות
 */
export function getQualitySummary(validation) {
    const qualityLevels = {
        excellent: { min: 0.9, label: 'מעולה', color: 'success' },
        good: { min: 0.7, label: 'טוב', color: 'info' },
        fair: { min: 0.5, label: 'בינוני', color: 'warning' },
        poor: { min: 0, label: 'נמוך', color: 'error' }
    };

    const confidence = validation.confidence;
    let level = 'poor';

    for (const [levelName, config] of Object.entries(qualityLevels)) {
        if (confidence >= config.min) {
            level = levelName;
            break;
        }
    }

    return {
        level,
        ...qualityLevels[level],
        confidence,
        issuesCount: validation.issues.length,
        warningsCount: validation.warnings.length,
        needsAttention: validation.issues.length > 0 || validation.warnings.length > 2
    };
}
