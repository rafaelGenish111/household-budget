/**
 * ReceiptMerger - מרכיב חשבונית שלמה ממספר תמונות
 */

import { findOverlap, analyzeOverlapQuality } from './overlapDetector.js';

/**
 * מרכיב חשבונית שלמה ממספר תמונות
 * @param {Object} session - אובייקט ReceiptSession
 * @returns {Object} - תוצאות המיזוג
 */
export function mergeReceipt(session) {
    const sortedImages = sortImagesByOrder(session.images);

    if (sortedImages.length === 0) {
        return createEmptyResult();
    }

    if (sortedImages.length === 1) {
        return createSingleImageResult(sortedImages[0]);
    }

    // אסטרטגיה 1: נסה למזג לפי חפיפות
    const mergedByOverlap = mergeByOverlap(sortedImages);

    // אסטרטגיה 2: אם אין מספיק חפיפות, מזג לפי מיקום
    const mergedByPosition = mergeByPosition(sortedImages);

    // בחר את האסטרטגיה עם ה-confidence הגבוה יותר
    const result = mergedByOverlap.confidence > mergedByPosition.confidence
        ? mergedByOverlap
        : mergedByPosition;

    // validation נוסף
    result.validation = validateMergedReceipt(result);

    return result;
}

/**
 * מיזוג לפי חפיפות בין תמונות
 * @param {Array} images - תמונות ממוינות לפי סדר
 * @returns {Object} - תוצאות המיזוג
 */
export function mergeByOverlap(images) {
    let allItems = [];
    let allLines = [];
    let totalConfidence = 0;
    let gapsDetected = [];

    // התחל עם התמונה הראשונה
    allItems.push(...images[0].parsedData.items || []);
    allLines.push(...images[0].parsedData.allLines || []);

    // מזג כל תמונה עם הקודמת
    for (let i = 1; i < images.length; i++) {
        const overlap = findOverlap(
            images[i - 1].parsedData,
            images[i].parsedData
        );

        if (overlap.confidence > 0.6) {
            // יש חפיפה טובה - הסר שורות כפולות
            const newLines = (images[i].parsedData.allLines || []).slice(overlap.cutIndex2);
            const newItems = extractItemsFromLines(newLines, images[i].id);

            allLines.push(...newLines);
            allItems.push(...newItems);
            totalConfidence += overlap.confidence;
        } else {
            // אין חפיפה - זה בעייתי, נסמן warning
            console.warn(`Low overlap confidence between images ${i - 1} and ${i}: ${overlap.confidence}`);

            // בכל זאת נוסיף, אבל עם סימון
            allLines.push('--- GAP DETECTED ---');
            allLines.push(...(images[i].parsedData.allLines || []));
            allItems.push(...(images[i].parsedData.items || []));
            totalConfidence += 0.3;  // ציון נמוך

            gapsDetected.push(`Between image ${i - 1} and ${i}`);
        }
    }

    return {
        items: deduplicateItems(allItems),
        allLines,
        total: findTotal(allLines),
        businessInfo: extractBusinessInfo(allLines),
        date: extractDate(allLines),
        confidence: totalConfidence / Math.max(images.length - 1, 1),
        method: 'overlap',
        gapsDetected,
        metadata: {
            mergeMethod: 'overlap',
            totalImages: images.length,
            processingTime: Date.now(),
            gapsDetected
        }
    };
}

/**
 * מיזוג לפי מיקום (סדר כרונולוגי)
 * @param {Array} images - תמונות ממוינות לפי סדר
 * @returns {Object} - תוצאות המיזוג
 */
export function mergeByPosition(images) {
    let allItems = [];
    let allLines = [];

    images.forEach(img => {
        allItems.push(...(img.parsedData.items || []));
        allLines.push(...(img.parsedData.allLines || []));
    });

    return {
        items: smartDeduplication(allItems),
        allLines,
        total: findTotal(allLines),
        businessInfo: extractBusinessInfo(allLines),
        date: extractDate(allLines),
        confidence: 0.7,  // ציון בינוני
        method: 'position',
        gapsDetected: [],
        metadata: {
            mergeMethod: 'position',
            totalImages: images.length,
            processingTime: Date.now(),
            gapsDetected: []
        }
    };
}

/**
 * הסרת כפילויות בסיסית
 * @param {Array} items - רשימת פריטים
 * @returns {Array} - פריטים ללא כפילויות
 */
export function deduplicateItems(items) {
    const unique = [];
    const seen = new Set();

    for (const item of items) {
        const key = `${item.description}_${item.price}`;
        const fuzzyKey = fuzzyItemKey(item);

        if (!seen.has(key) && !seen.has(fuzzyKey)) {
            unique.push(item);
            seen.add(key);
            seen.add(fuzzyKey);
        }
    }

    return unique;
}

/**
 * הסרת כפילויות חכמה - מזהה פריטים דומים
 * @param {Array} items - רשימת פריטים
 * @returns {Array} - פריטים ללא כפילויות
 */
export function smartDeduplication(items) {
    const clusters = [];

    for (const item of items) {
        let foundCluster = false;

        for (const cluster of clusters) {
            const representative = cluster[0];
            const similarity = itemSimilarity(item, representative);

            if (similarity > 0.85) {
                cluster.push(item);
                foundCluster = true;
                break;
            }
        }

        if (!foundCluster) {
            clusters.push([item]);
        }
    }

    // מכל cluster קח את הפריט עם ה-confidence הגבוה ביותר
    return clusters.map(cluster =>
        cluster.reduce((best, current) =>
            (current.confidence || 0) > (best.confidence || 0) ? current : best
        )
    );
}

/**
 * מחשב דמיון בין שני פריטים
 * @param {Object} item1 - פריט ראשון
 * @param {Object} item2 - פריט שני
 * @returns {number} - ציון דמיון בין 0 ל-1
 */
export function itemSimilarity(item1, item2) {
    const descSimilarity = lineSimilarity(item1.description, item2.description);
    const priceSimilarity = Math.abs(item1.price - item2.price) < 0.01 ? 1 : 0;

    return (descSimilarity * 0.7) + (priceSimilarity * 0.3);
}

/**
 * מחשב דמיון בין שתי שורות טקסט (עזר)
 * @param {string} line1 - שורה ראשונה
 * @param {string} line2 - שורה שנייה
 * @returns {number} - ציון דמיון
 */
function lineSimilarity(line1, line2) {
    if (!line1 || !line2) return 0;

    const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');
    const norm1 = normalize(line1);
    const norm2 = normalize(line2);

    if (norm1 === norm2) return 1.0;

    // Levenshtein distance פשוט
    const distance = levenshteinDistance(norm1, norm2);
    const maxLen = Math.max(norm1.length, norm2.length);

    return maxLen === 0 ? 1.0 : 1 - (distance / maxLen);
}

/**
 * מחשב מרחק Levenshtein (עזר)
 * @param {string} str1 - מחרוזת ראשונה
 * @param {string} str2 - מחרוזת שנייה
 * @returns {number} - מרחק
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * יוצר מפתח מטושטש לפריט
 * @param {Object} item - פריט
 * @returns {string} - מפתח מטושטש
 */
function fuzzyItemKey(item) {
    const desc = item.description.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '');
    const price = Math.round(item.price * 100); // עיגול לסנטים
    return `${desc}_${price}`;
}

/**
 * מחלץ פריטים משורות טקסט
 * @param {Array} lines - שורות טקסט
 * @param {string} sourceImageId - מזהה התמונה המקור
 * @returns {Array} - פריטים מחולצים
 */
function extractItemsFromLines(lines, sourceImageId) {
    const items = [];
    const itemPatterns = [
        /^(.+?)\s+(\d+\.?\d{0,2})\s*$/,
        /^(\d+)\s*x\s*(.+?)\s+(\d+\.?\d{0,2})\s*$/,
        /^(.+?)\s+(\d+\.?\d{0,2})\s*x\s*(\d+)\s*$/
    ];

    for (const line of lines) {
        for (const pattern of itemPatterns) {
            const match = line.match(pattern);
            if (match) {
                const price = parseFloat(match[match.length - 1]);
                if (price > 0 && price < 10000) {
                    items.push({
                        description: match[1].trim(),
                        price: price,
                        quantity: 1,
                        unitPrice: price,
                        sourceImage: sourceImageId,
                        confidence: 0.8
                    });
                }
                break;
            }
        }
    }

    return items;
}

/**
 * מוצא סכום כולל מהשורות
 * @param {Array} lines - שורות טקסט
 * @returns {number|null} - סכום כולל
 */
function findTotal(lines) {
    const totalKeywords = [
        'סה"כ לתשלום', 'סה\"כ לתשלום', 'סך הכל לתשלום',
        'סכום לתשלום', 'לתשלום', 'סכום סופי',
        'total', 'grand total', 'balance due'
    ];

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (totalKeywords.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
            const amounts = line.match(/\d+\.?\d{0,2}|\d+,\d{2}/g);
            if (amounts && amounts.length > 0) {
                const amount = parseFloat(amounts[amounts.length - 1].replace(',', ''));
                if (amount > 0) return amount;
            }
        }
    }

    return null;
}

/**
 * מחלץ מידע על העסק מהשורות
 * @param {Array} lines - שורות טקסט
 * @returns {Object} - מידע על העסק
 */
function extractBusinessInfo(lines) {
    const businessInfo = {
        name: null,
        taxId: null,
        address: null,
        phone: null,
        email: null
    };

    // חיפוש שם עסק בשורות הראשונות
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length > 2 && line.length < 100 && !line.match(/^\d/)) {
            businessInfo.name = line;
            break;
        }
    }

    // חיפוש ח.ע.מ
    const taxIdPattern = /ח\.ע\.מ[:\s]*(\d{9})|ע\.מ[:\s]*(\d{9})/;
    for (const line of lines) {
        const match = line.match(taxIdPattern);
        if (match) {
            businessInfo.taxId = match[1] || match[2];
            break;
        }
    }

    return businessInfo;
}

/**
 * מחלץ תאריך מהשורות
 * @param {Array} lines - שורות טקסט
 * @returns {Date|null} - תאריך
 */
function extractDate(lines) {
    const patterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/
    ];

    for (const line of lines) {
        for (const pattern of patterns) {
            const match = line.match(pattern);
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
    }

    return null;
}

/**
 * ממיין תמונות לפי סדר
 * @param {Array} images - תמונות
 * @returns {Array} - תמונות ממוינות
 */
function sortImagesByOrder(images) {
    return [...images].sort((a, b) => a.order - b.order);
}

/**
 * יוצר תוצאה ריקה
 * @returns {Object} - תוצאה ריקה
 */
function createEmptyResult() {
    return {
        items: [],
        allLines: [],
        total: null,
        businessInfo: {},
        date: null,
        confidence: 0,
        method: 'empty',
        gapsDetected: [],
        validation: {
            isValid: false,
            issues: [{ type: 'no_images', severity: 'high', message: 'אין תמונות למיזוג' }],
            recommendations: ['צלם לפחות תמונה אחת של החשבונית']
        }
    };
}

/**
 * יוצר תוצאה לתמונה יחידה
 * @param {Object} image - תמונה יחידה
 * @returns {Object} - תוצאה
 */
function createSingleImageResult(image) {
    return {
        items: image.parsedData.items || [],
        allLines: image.parsedData.allLines || [],
        total: image.parsedData.total || null,
        businessInfo: image.parsedData.businessInfo || {},
        date: image.parsedData.date || null,
        confidence: image.parsedData.confidence || 0.8,
        method: 'single',
        gapsDetected: [],
        validation: {
            isValid: true,
            issues: [],
            recommendations: []
        }
    };
}

/**
 * מאמת את התוצאה הממוזגת
 * @param {Object} mergedResult - תוצאה ממוזגת
 * @returns {Object} - תוצאות האימות
 */
export function validateMergedReceipt(mergedResult) {
    const issues = [];

    // בדיקה 1: סכום פריטים מול סכום כולל
    if (mergedResult.total && mergedResult.items.length > 0) {
        const itemsSum = mergedResult.items.reduce((sum, item) => sum + item.price, 0);
        const difference = Math.abs(itemsSum - mergedResult.total);
        const percentDiff = (difference / mergedResult.total) * 100;

        if (percentDiff > 5) {
            issues.push({
                type: 'sum_mismatch',
                severity: percentDiff > 15 ? 'high' : 'medium',
                message: `סכום הפריטים (${itemsSum.toFixed(2)}) לא תואם לסכום הכולל (${mergedResult.total})`,
                details: { difference, percentDiff }
            });
        }
    }

    // בדיקה 2: זיהוי gaps אפשריים
    if (mergedResult.gapsDetected.length > 0) {
        issues.push({
            type: 'gap_detected',
            severity: 'high',
            message: 'זוהו פערים בין תמונות - יתכן שחסרים פריטים',
            details: { gaps: mergedResult.gapsDetected }
        });
    }

    // בדיקה 3: ביטחון נמוך
    if (mergedResult.confidence < 0.5) {
        issues.push({
            type: 'low_confidence',
            severity: 'medium',
            message: 'רמת הביטחון נמוכה - נדרש בדיקה ידנית',
            details: { confidence: mergedResult.confidence }
        });
    }

    // בדיקה 4: אין פריטים
    if (mergedResult.items.length === 0) {
        issues.push({
            type: 'no_items',
            severity: 'high',
            message: 'לא זוהו פריטים בחשבונית',
            details: {}
        });
    }

    // בדיקה 5: אין סכום כולל
    if (!mergedResult.total) {
        issues.push({
            type: 'no_total',
            severity: 'medium',
            message: 'לא זוהה סכום כולל',
            details: {}
        });
    }

    const recommendations = generateRecommendations(issues);
    const overallScore = calculateOverallScore(mergedResult, issues);

    return {
        isValid: issues.filter(i => i.severity === 'high').length === 0,
        issues,
        recommendations,
        overallScore
    };
}

/**
 * יוצר המלצות על בסיס הבעיות
 * @param {Array} issues - בעיות שזוהו
 * @returns {Array} - המלצות
 */
function generateRecommendations(issues) {
    const recommendations = [];

    if (issues.some(i => i.type === 'gap_detected')) {
        recommendations.push('צלם מחדש עם חפיפה טובה יותר בין התמונות');
    }

    if (issues.some(i => i.type === 'sum_mismatch' && i.severity === 'high')) {
        recommendations.push('וודא שצילמת את כל החשבונית כולל הסכום הסופי');
    }

    if (issues.some(i => i.type === 'low_confidence')) {
        recommendations.push('נסה לצלם שוב את החשבונית באור טוב יותר');
    }

    if (issues.some(i => i.type === 'no_items')) {
        recommendations.push('ודא שהטקסט בחשבונית קריא וברור');
    }

    return recommendations;
}

/**
 * מחשב ציון כולל
 * @param {Object} mergedResult - תוצאה ממוזגת
 * @param {Array} issues - בעיות
 * @returns {number} - ציון כולל
 */
function calculateOverallScore(mergedResult, issues) {
    let score = mergedResult.confidence;

    // הפחתה עבור בעיות חמורות
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;

    score -= (highSeverityIssues * 0.3);
    score -= (mediumSeverityIssues * 0.1);

    // בונוס עבור תוצאות טובות
    if (mergedResult.items.length > 0) score += 0.1;
    if (mergedResult.total) score += 0.1;
    if (mergedResult.businessInfo.name) score += 0.05;

    return Math.max(0, Math.min(1, score));
}

export default {
    mergeReceipt,
    mergeByOverlap,
    mergeByPosition,
    deduplicateItems,
    smartDeduplication,
    itemSimilarity,
    validateMergedReceipt
};
