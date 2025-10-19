/**
 * OverlapDetector - מזהה חפיפות בין תמונות רצופות של חשבונית
 */

/**
 * מוצא את השורות החופפות בין שתי תמונות רצופות
 * @param {Object} image1ParsedData - נתונים מנותחים מהתמונה הראשונה
 * @param {Object} image2ParsedData - נתונים מנותחים מהתמונה השנייה
 * @returns {Object} - { overlapLines, confidence, suggestedCutPoint, cutIndex1, cutIndex2 }
 */
export function findOverlap(image1ParsedData, image2ParsedData) {
    const lines1 = image1ParsedData.allLines || [];
    const lines2 = image2ParsedData.allLines || [];

    if (lines1.length === 0 || lines2.length === 0) {
        return {
            overlapLines: [],
            confidence: 0,
            suggestedCutPoint: null,
            cutIndex1: 0,
            cutIndex2: 0
        };
    }

    // חפש את השורות האחרונות של תמונה 1 בתחילת תמונה 2
    const lastLines1 = lines1.slice(-10); // 10 שורות אחרונות
    const firstLines2 = lines2.slice(0, 15); // 15 שורות ראשונות

    let bestMatch = {
        lines: [],
        confidence: 0,
        cutIndex1: 0,
        cutIndex2: 0
    };

    // נסה כל אפשרות של חפיפה (sliding window)
    for (let i = 0; i < lastLines1.length; i++) {
        for (let j = 0; j < firstLines2.length; j++) {
            const match = compareLineSequence(
                lastLines1.slice(i),
                firstLines2.slice(j)
            );

            if (match.confidence > bestMatch.confidence) {
                bestMatch = {
                    lines: match.matchingLines,
                    confidence: match.confidence,
                    cutIndex1: lines1.length - lastLines1.length + i,
                    cutIndex2: j + match.matchingLines.length
                };
            }
        }
    }

    return {
        overlapLines: bestMatch.lines,
        confidence: bestMatch.confidence,
        suggestedCutPoint: bestMatch.lines.length > 0 ? bestMatch.lines[bestMatch.lines.length - 1] : null,
        cutIndex1: bestMatch.cutIndex1,
        cutIndex2: bestMatch.cutIndex2
    };
}

/**
 * משווה רצף שורות ומחשב ציון דמיון
 * @param {Array<string>} seq1 - רצף שורות ראשון
 * @param {Array<string>} seq2 - רצף שורות שני
 * @returns {Object} - { matchingLines, confidence }
 */
export function compareLineSequence(seq1, seq2) {
    const maxLen = Math.min(seq1.length, seq2.length);
    let matchingLines = [];
    let totalSimilarity = 0;

    for (let i = 0; i < maxLen; i++) {
        const similarity = lineSimilarity(seq1[i], seq2[i]);

        if (similarity > 0.7) {  // סף דמיון
            matchingLines.push(seq1[i]);
            totalSimilarity += similarity;
        } else {
            break;  // ברגע שאין דמיון - עצור
        }
    }

    return {
        matchingLines,
        confidence: matchingLines.length > 0
            ? totalSimilarity / matchingLines.length
            : 0
    };
}

/**
 * מחשב דמיון בין שתי שורות טקסט
 * משתמש ב-Levenshtein distance + fuzzy matching
 * @param {string} line1 - שורה ראשונה
 * @param {string} line2 - שורה שנייה
 * @returns {number} - ציון דמיון בין 0 ל-1
 */
export function lineSimilarity(line1, line2) {
    if (!line1 || !line2) return 0;

    // נרמול הטקסט
    const normalize = (str) => str
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[״׳]/g, '"')  // תווים עבריים מיוחדים
        .replace(/[׳]/g, "'")
        .replace(/[״]/g, '"')
        .toLowerCase();

    const norm1 = normalize(line1);
    const norm2 = normalize(line2);

    if (norm1 === norm2) return 1.0;

    // Levenshtein distance
    const distance = levenshteinDistance(norm1, norm2);
    const maxLen = Math.max(norm1.length, norm2.length);

    if (maxLen === 0) return 1.0;

    const similarity = 1 - (distance / maxLen);

    // הגברת ציון עבור שורות קצרות זהות
    if (norm1.length < 10 && norm2.length < 10 && similarity > 0.8) {
        return Math.min(similarity * 1.2, 1.0);
    }

    return similarity;
}

/**
 * מחשב את מרחק Levenshtein בין שני מחרוזות
 * @param {string} str1 - מחרוזת ראשונה
 * @param {string} str2 - מחרוזת שנייה
 * @returns {number} - מרחק Levenshtein
 */
export function levenshteinDistance(str1, str2) {
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
 * בודק אם יש חפיפה טובה בין שתי תמונות
 * @param {Object} image1ParsedData - נתונים מהתמונה הראשונה
 * @param {Object} image2ParsedData - נתונים מהתמונה השנייה
 * @param {number} minConfidence - ציון מינימלי (ברירת מחדל: 0.6)
 * @returns {boolean} - האם יש חפיפה טובה
 */
export function hasGoodOverlap(image1ParsedData, image2ParsedData, minConfidence = 0.6) {
    const overlap = findOverlap(image1ParsedData, image2ParsedData);
    return overlap.confidence >= minConfidence && overlap.overlapLines.length >= 2;
}

/**
 * מחזיר המלצות לשיפור החפיפה
 * @param {Object} overlapResult - תוצאות זיהוי החפיפה
 * @returns {Array<string>} - רשימת המלצות
 */
export function getOverlapRecommendations(overlapResult) {
    const recommendations = [];

    if (overlapResult.confidence < 0.3) {
        recommendations.push('אין חפיפה מספקת - צלם שוב עם חפיפה גדולה יותר');
        recommendations.push('ודא שהתמונה השנייה כוללת את 2-3 השורות האחרונות מהתמונה הראשונה');
    } else if (overlapResult.confidence < 0.6) {
        recommendations.push('חפיפה חלשה - נסה לצלם עם חפיפה טובה יותר');
        recommendations.push('ודא שהטקסט ברור וקריא בשתי התמונות');
    } else if (overlapResult.confidence >= 0.8) {
        recommendations.push('חפיפה מעולה! המשך לצלם את שאר החשבונית');
    }

    if (overlapResult.overlapLines.length < 2) {
        recommendations.push('נדרשות לפחות 2 שורות חופפות לזיהוי טוב');
    }

    return recommendations;
}

/**
 * מנתח את איכות החפיפה ומחזיר דוח מפורט
 * @param {Object} image1ParsedData - נתונים מהתמונה הראשונה
 * @param {Object} image2ParsedData - נתונים מהתמונה השנייה
 * @returns {Object} - דוח מפורט על החפיפה
 */
export function analyzeOverlapQuality(image1ParsedData, image2ParsedData) {
    const overlap = findOverlap(image1ParsedData, image2ParsedData);
    const recommendations = getOverlapRecommendations(overlap);

    // ניתוח נוסף
    const analysis = {
        overlap,
        recommendations,
        quality: {
            score: overlap.confidence,
            level: overlap.confidence >= 0.8 ? 'excellent' :
                overlap.confidence >= 0.6 ? 'good' :
                    overlap.confidence >= 0.3 ? 'fair' : 'poor',
            issues: []
        },
        statistics: {
            totalLines1: image1ParsedData.allLines?.length || 0,
            totalLines2: image2ParsedData.allLines?.length || 0,
            overlappingLines: overlap.overlapLines.length,
            overlapPercentage: overlap.overlapLines.length / Math.min(
                image1ParsedData.allLines?.length || 1,
                image2ParsedData.allLines?.length || 1
            ) * 100
        }
    };

    // זיהוי בעיות ספציפיות
    if (overlap.confidence < 0.3) {
        analysis.quality.issues.push('חפיפה לא מספקת');
    }

    if (overlap.overlapLines.length < 2) {
        analysis.quality.issues.push('מעט מדי שורות חופפות');
    }

    if (analysis.statistics.overlapPercentage > 50) {
        analysis.quality.issues.push('יותר מדי חפיפה - יתכן שצילמת את אותו חלק פעמיים');
    }

    return analysis;
}

/**
 * מחזיר טיפים לצילום טוב יותר בהתבסס על החפיפה הנוכחית
 * @param {Object} overlapAnalysis - ניתוח החפיפה
 * @returns {Array<string>} - טיפים ספציפיים
 */
export function getPhotographyTipsForOverlap(overlapAnalysis) {
    const tips = [];

    if (overlapAnalysis.quality.level === 'poor') {
        tips.push('החזק את המכשיר באותו זווית כמו בתמונה הקודמת');
        tips.push('ודא שהתאורה זהה לזו של התמונה הקודמת');
        tips.push('צלם במרחק דומה מהחשבונית');
    }

    if (overlapAnalysis.statistics.overlapPercentage < 10) {
        tips.push('צלם עם חפיפה של לפחות 2-3 שורות');
        tips.push('התחל את התמונה החדשה מהשורה האחרונה שצילמת');
    }

    if (overlapAnalysis.statistics.overlapPercentage > 50) {
        tips.push('יש יותר מדי חפיפה - נסה לצלם חלק חדש של החשבונית');
    }

    tips.push('ודא שהחשבונית שטוחה ולא מקופלת');
    tips.push('הימנע מבהיקות או השתקפויות');

    return tips;
}

export default {
    findOverlap,
    compareLineSequence,
    lineSimilarity,
    levenshteinDistance,
    hasGoodOverlap,
    getOverlapRecommendations,
    analyzeOverlapQuality,
    getPhotographyTipsForOverlap
};
