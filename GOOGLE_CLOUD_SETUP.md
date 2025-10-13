# 🔧 הדרכה להפעלת Google Cloud Vision API

## ⚠️ הבעיה שאתה מקבל:
```
PERMISSION_DENIED: This API method requires billing to be enabled
```

## ✅ פתרון שלב אחר שלב:

### שלב 1: ודא שה-Billing מופעל ✓
אתה כבר עשית את זה! 👍

### שלב 2: הפעל את Vision API בפרויקט ⚠️

1. **עבור ל-Google Cloud Console**:
   https://console.cloud.google.com/

2. **בחר את הפרויקט שלך**: `household-budget-475002`

3. **עבור ל-APIs & Services**:
   https://console.cloud.google.com/apis/library?project=household-budget-475002

4. **חפש "Vision API"**:
   - הקלד "Vision" בחיפוש
   - לחץ על "Cloud Vision API"

5. **לחץ "ENABLE" (הפעל)**

6. **המתן 1-2 דקות** שה-API יופעל

### שלב 3: ודא שה-Service Account נכון

1. עבור ל-**IAM & Admin** → **Service Accounts**:
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=household-budget-475002

2. ודא שה-Service Account שלך קיים

3. ודא שיש לו הרשאות:
   - `Cloud Vision API User` או
   - `Editor` / `Owner`

### שלב 4 (אם צריך): צור Service Account חדש

אם אין Service Account או שאין לו הרשאות:

1. לחץ **"+ CREATE SERVICE ACCOUNT"**
2. שם: `household-budget-vision`
3. תיאור: `Service account for receipt scanning`
4. לחץ **CREATE AND CONTINUE**
5. בחר Role: **Cloud Vision API User**
6. לחץ **CONTINUE** → **DONE**
7. לחץ על ה-Service Account שיצרת
8. לשונית **KEYS** → **ADD KEY** → **Create new key**
9. בחר **JSON** → **CREATE**
10. הורד את הקובץ
11. שם אותו בתיקיית `server/` עם שם ברור
12. עדכן את `.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=./השם-של-הקובץ-החדש.json
```

---

## 🕐 אם הפעלת עכשיו את Billing

**המתן 5-10 דקות!** 

Google Cloud צריך זמן להפעיל את הגישה. זה לא מיידי.

**אחרי שתחכה**:
1. הפעל מחדש את השרת (`rs` ב-nodemon או Ctrl+C ואז `nodemon`)
2. נסה שוב לסרוק

---

## 🧪 בדיקה מהירה

הרץ את זה כדי לבדוק אם ה-API מופעל:

```bash
curl -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  "https://vision.googleapis.com/v1/projects/household-budget-475002"
```

או פשוט המתן 5-10 דקות ונסה שוב.

---

## 💡 פתרון זמני: עבוד בלי Vision API

אם אתה רוצה להמשיך לעבוד בינתיים, אני יכול להחזיר את הקוד למצב שעובד ללא Vision API (המשתמש ימלא ידנית).

