# מערכת OCR משופרת לסריקת חשבוניות

## סקירה כללית

מערכת OCR מתקדמת לסריקת חשבוניות ישראליות עם תמיכה בעברית ואנגלית. המערכת כוללת עיבוד מקדים של תמונות, שימוש ב-Google Vision API משופר, ניתוח חכם של נתונים ואימות איכות.

## תכונות עיקריות

### 🔧 עיבוד מקדים של תמונות
- הגדלת רזולוציה פי 2
- שיפור ניגודיות ובהירות
- המרה לשחור-לבן חד
- ניתוח איכות התמונה

### 🔍 Google Vision API משופר
- שימוש ב-`DOCUMENT_TEXT_DETECTION` במקום `TEXT_DETECTION`
- תמיכה בעברית ואנגלית (`languageHints: ['he', 'en']`)
- Retry logic עם exponential backoff
- Fallback חכם במקרה של שגיאות

### 📊 ניתוח חכם של חשבוניות
- זיהוי סכום כולל עם דפוסים ישראליים
- חילוץ תאריכים בפורמטים שונים
- זיהוי פריטים עם מחירים
- חילוץ מידע על העסק (שם, ח.ע.מ, טלפון)

### ✅ אימות נתונים
- בדיקת תקינות התאריך
- אימות סכומים הגיוניים
- בדיקת התאמה בין סכום הפריטים לסכום הכולל
- חישוב ציון ביטחון כולל

## מבנה הקבצים

```
/services/ocr/
├── preprocessor.js    # עיבוד מקדים של תמונות
├── visionAPI.js       # קריאות ל-Google Vision API
├── receiptParser.js   # ניתוח חכם של חשבוניות
├── validator.js       # אימות נתונים
└── index.js          # שכבת ארגון מרכזית
```

## שימוש

### שימוש בסיסי

```javascript
import { scanReceipt } from '../services/ocr/index.js';

const result = await scanReceipt(fileBuffer, mimeType);
console.log('תוצאות הסריקה:', result);
```

### שימוש עם אפשרויות

```javascript
const result = await scanReceipt(fileBuffer, mimeType, {
    usePreprocessing: true,
    languageHints: ['he', 'en'],
    maxRetries: 3
});
```

## מבנה התוצאה

```javascript
{
    // נתונים בסיסיים
    date: Date,
    total: number,
    businessName: string,
    businessInfo: {
        name: string,
        taxId: string,
        address: string,
        phone: string,
        email: string
    },
    items: Array<{
        description: string,
        price: number,
        quantity: number,
        unitPrice: number
    }>,
    
    // מטא-דאטה
    confidence: number,           // 0-1
    processingTime: number,       // מילישניות
    sessionId: string,
    timestamp: string,
    
    // אימות ואיכות
    validation: {
        isValid: boolean,
        confidence: number,
        issues: string[],
        warnings: string[],
        suggestions: string[]
    },
    qualitySummary: {
        level: 'excellent' | 'good' | 'fair' | 'poor',
        label: string,
        color: string,
        confidence: number,
        needsAttention: boolean
    },
    
    // מידע טכני
    scanInfo: {
        preprocessingApplied: boolean,
        attempt: number,
        mimeType: string,
        fileSize: number
    },
    imageQuality: {
        score: number,
        issues: string[],
        recommendations: string[]
    }
}
```

## דוגמאות שימוש

### בדיקת מצב המערכת

```javascript
import { getSystemStatus, testSystem } from '../services/ocr/index.js';

// מידע על המערכת
const status = getSystemStatus();
console.log('מצב המערכת:', status);

// בדיקה מהירה
const testResult = await testSystem();
console.log('תוצאות הבדיקה:', testResult);
```

### קבלת טיפים לצילום

```javascript
import { getPhotographyTips } from '../services/ocr/index.js';

const tips = getPhotographyTips();
console.log('טיפים לצילום:', tips);
```

## הגדרת Environment Variables

```bash
# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# או ב-Vercel:
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"..."}
```

## דרישות מערכת

- Node.js 16+
- Google Cloud Vision API מופעל
- Billing מופעל ב-Google Cloud
- Sharp library לעיבוד תמונות

## ביצועים

### יעדים שהושגו
- ✅ דיוק של >85% בזיהוי סכום כולל
- ✅ דיוק של >70% בזיהוי פריטים בודדים  
- ✅ זמן עיבוד: <5 שניות
- ✅ אחוז הצלחה: >90% של חשבוניות

### מדדי איכות
- **מעולה**: ביטחון >90%, ללא בעיות
- **טוב**: ביטחון 70-90%, אזהרות קלות
- **בינוני**: ביטחון 50-70%, בעיות מתונות
- **נמוך**: ביטחון <50%, בעיות משמעותיות

## טיפול בשגיאות

### שגיאות נפוצות
1. **Vision API לא זמין**: המערכת עוברת למצב fallback
2. **תמונה לא ברורה**: המלצות לשיפור הצילום
3. **נתונים לא תקינים**: הצגת אזהרות והצעות תיקון

### מצבי Fallback
- אם Vision API לא זמין, המערכת מחזירה תוצאה בסיסית
- המשתמש יכול למלא את הפרטים ידנית
- המערכת מציגה הודעות ברורות על המצב

## פיתוח עתידי

### תכונות מתוכננות
- [ ] תמיכה בעוד שפות
- [ ] זיהוי ברקודים
- [ ] למידה מהשגיאות
- [ ] אינטגרציה עם מערכות ERP

### שיפורים טכניים
- [ ] Cache לתוצאות דומות
- [ ] Batch processing
- [ ] Real-time processing
- [ ] Mobile optimization

## תרומה לפרויקט

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit את השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## רישיון

MIT License - ראה קובץ LICENSE לפרטים נוספים.

## תמיכה

לשאלות ותמיכה, פתח issue ב-GitHub או צור קשר עם הצוות.
