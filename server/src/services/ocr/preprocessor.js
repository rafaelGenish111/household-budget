/**
 * עיבוד מקדים של תמונות לשיפור דיוק OCR
 * כולל הגדלת רזולוציה, שיפור ניגודיות והמרה לשחור-לבן
 */

import sharp from 'sharp';

/**
 * מבצע עיבוד מקדים על תמונה לשיפור דיוק OCR
 * @param {Buffer} imageBuffer - Buffer של התמונה המקורית
 * @param {Object} options - אפשרויות עיבוד
 * @param {number} options.scaleFactor - גורם הגדלה (ברירת מחדל: 2)
 * @param {number} options.contrast - רמת ניגודיות (ברירת מחדל: 1.5)
 * @param {number} options.brightness - רמת בהירות (ברירת מחדל: 1.1)
 * @param {number} options.threshold - סף להמרה לשחור-לבן (ברירת מחדל: 128)
 * @returns {Promise<{processedBuffer: Buffer, originalBuffer: Buffer, metadata: Object}>}
 */
export async function preprocessImage(imageBuffer, options = {}) {
    const {
        scaleFactor = 2,
        contrast = 1.5,
        brightness = 1.1,
        threshold = 128
    } = options;

    try {
        console.log('🔧 מתחיל עיבוד מקדים של התמונה...');

        // קבלת מטא-דאטה של התמונה המקורית
        const originalMetadata = await sharp(imageBuffer).metadata();
        console.log('📊 מטא-דאטה מקורית:', {
            width: originalMetadata.width,
            height: originalMetadata.height,
            format: originalMetadata.format,
            size: imageBuffer.length
        });

        // עיבוד התמונה עם Sharp
        const processedBuffer = await sharp(imageBuffer)
            // הגדלת רזולוציה פי scaleFactor
            .resize({
                width: originalMetadata.width * scaleFactor,
                height: originalMetadata.height * scaleFactor,
                kernel: sharp.kernel.lanczos3 // איכות גבוהה להגדלה
            })
            // שיפור ניגודיות ובהירות
            .modulate({
                brightness: brightness * 100, // Sharp מצפה לערכים 0-200
                contrast: contrast * 100      // Sharp מצפה לערכים 0-200
            })
            // המרה לגווני אפור
            .grayscale()
            // המרה לשחור-לבן חד עם threshold
            .threshold(threshold)
            // המרה ל-JPEG באיכות גבוהה
            .jpeg({
                quality: 95,
                progressive: true,
                mozjpeg: true // אופטימיזציה מתקדמת
            })
            .toBuffer();

        // קבלת מטא-דאטה של התמונה המעובדת
        const processedMetadata = await sharp(processedBuffer).metadata();
        console.log('✅ עיבוד הושלם:', {
            originalSize: imageBuffer.length,
            processedSize: processedBuffer.length,
            scaleFactor: scaleFactor,
            newDimensions: `${processedMetadata.width}x${processedMetadata.height}`
        });

        return {
            processedBuffer,
            originalBuffer: imageBuffer,
            metadata: {
                original: originalMetadata,
                processed: processedMetadata,
                processingOptions: {
                    scaleFactor,
                    contrast,
                    brightness,
                    threshold
                }
            }
        };

    } catch (error) {
        console.error('❌ שגיאה בעיבוד מקדים של התמונה:', error);
        throw new Error(`שגיאה בעיבוד מקדים: ${error.message}`);
    }
}

/**
 * בודק אם התמונה זקוקה לעיבוד מקדים
 * @param {Buffer} imageBuffer - Buffer של התמונה
 * @returns {Promise<boolean>}
 */
export async function needsPreprocessing(imageBuffer) {
    try {
        const metadata = await sharp(imageBuffer).metadata();

        // בדיקות לקביעת הצורך בעיבוד מקדים
        const needsProcessing =
            metadata.width < 1000 ||           // רזולוציה נמוכה
            metadata.height < 1000 ||          // רזולוציה נמוכה
            imageBuffer.length < 100000 ||     // קובץ קטן מדי
            metadata.format === 'gif' ||       // פורמט לא אופטימלי
            metadata.format === 'webp';        // פורמט לא אופטימלי

        console.log('🔍 בדיקת צורך בעיבוד מקדים:', {
            dimensions: `${metadata.width}x${metadata.height}`,
            format: metadata.format,
            size: imageBuffer.length,
            needsProcessing
        });

        return needsProcessing;
    } catch (error) {
        console.warn('⚠️ לא ניתן לבדוק צורך בעיבוד מקדים:', error.message);
        return true; // בטוח - נבצע עיבוד מקדים
    }
}

/**
 * יוצר תצוגה מקדימה של התמונה המעובדת לצורך debug
 * @param {Buffer} processedBuffer - Buffer של התמונה המעובדת
 * @returns {Promise<string>} - Base64 string של התמונה
 */
export async function createDebugPreview(processedBuffer) {
    try {
        // יצירת תמונה קטנה יותר לצורך debug
        const previewBuffer = await sharp(processedBuffer)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        return `data:image/jpeg;base64,${previewBuffer.toString('base64')}`;
    } catch (error) {
        console.warn('⚠️ לא ניתן ליצור תצוגה מקדימה:', error.message);
        return null;
    }
}

/**
 * מחזיר טיפים לצילום טוב יותר
 * @returns {Array<string>} - רשימת טיפים
 */
export function getPhotographyTips() {
    return [
        'החזק את המכשיר ישר וקבוע',
        'ודא תאורה טובה - הימנע מצללים',
        'מלא את המסגרת עם החשבונית',
        'ודא שהטקסט קריא וברור',
        'הימנע מברקים או השתקפויות',
        'צלם במרחק של 20-30 ס"מ',
        'ודא שהחשבונית שטוחה ולא מקופלת'
    ];
}

/**
 * מנתח את איכות התמונה ומחזיר המלצות
 * @param {Buffer} imageBuffer - Buffer של התמונה
 * @returns {Promise<Object>} - ניתוח איכות והמלצות
 */
export async function analyzeImageQuality(imageBuffer) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const stats = await sharp(imageBuffer).stats();

        const analysis = {
            dimensions: {
                width: metadata.width,
                height: metadata.height,
                aspectRatio: metadata.width / metadata.height
            },
            fileSize: imageBuffer.length,
            format: metadata.format,
            quality: {
                score: 0,
                issues: [],
                recommendations: []
            }
        };

        // ניתוח איכות התמונה
        let qualityScore = 100;

        // בדיקת רזולוציה
        if (metadata.width < 800 || metadata.height < 800) {
            qualityScore -= 30;
            analysis.quality.issues.push('רזולוציה נמוכה');
            analysis.quality.recommendations.push('צלם ברזולוציה גבוהה יותר');
        }

        // בדיקת גודל קובץ
        if (imageBuffer.length < 50000) {
            qualityScore -= 20;
            analysis.quality.issues.push('קובץ קטן מדי');
            analysis.quality.recommendations.push('ודא שהתמונה לא דחוסה מדי');
        }

        // בדיקת יחס גובה-רוחב
        if (analysis.dimensions.aspectRatio < 0.5 || analysis.dimensions.aspectRatio > 3) {
            qualityScore -= 15;
            analysis.quality.issues.push('יחס גובה-רוחב לא אופטימלי');
            analysis.quality.recommendations.push('צלם את החשבונית במלואה');
        }

        // בדיקת בהירות ממוצעת
        const avgBrightness = stats.channels.reduce((sum, channel) => sum + channel.mean, 0) / stats.channels.length;
        if (avgBrightness < 50) {
            qualityScore -= 25;
            analysis.quality.issues.push('תמונה כהה מדי');
            analysis.quality.recommendations.push('שיפור תאורה');
        } else if (avgBrightness > 200) {
            qualityScore -= 15;
            analysis.quality.issues.push('תמונה בהירה מדי');
            analysis.quality.recommendations.push('הפחתת בהירות או הימנעות מברקים');
        }

        analysis.quality.score = Math.max(0, qualityScore);

        console.log('📊 ניתוח איכות תמונה:', analysis);

        return analysis;
    } catch (error) {
        console.error('❌ שגיאה בניתוח איכות התמונה:', error);
        return {
            quality: {
                score: 50,
                issues: ['לא ניתן לנתח'],
                recommendations: ['נסה שוב']
            }
        };
    }
}
