# 🏠 מערכת ניהול משק בית

מערכת FullStack מתקדמת לניהול תקציב משק בית עם React, Node.js, MongoDB ו-Google Cloud Vision API.

## ✨ תכונות

- 🔐 **אימות מלא** - הרשמה, התחברות, שכחתי סיסמה
- 📊 **Dashboard מתקדם** - גרפים, סטטיסטיקות, המלצות AI
- 💰 **ניהול תנועות** - הכנסות והוצאות עם סינונים מתקדמים
- 🏦 **חסכונות** - מעקב התקדמות ויעדים
- 📋 **התחייבויות** - ניהול הלוואות ותשלומים
- 🎯 **יעדי תקציב** - תקציב לפי קטגוריות עם יתרה חיה
- 📸 **סריקת חשבוניות** - Google Cloud Vision API
- 🌙 **Dark Mode** - תמיכה במצב כהה
- 🔄 **RTL Support** - תמיכה מלאה בעברית

## 🛠️ טכנולוגיות

### Frontend
- React 18 + Vite
- Material-UI (MUI)
- Redux Toolkit
- Recharts
- React Hook Form + Yup
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Google Cloud Vision API
- Multer (file uploads)
- Sharp (image processing)

## 🚀 התקנה מקומית

### דרישות
- Node.js 18+
- MongoDB
- Google Cloud Account (לסריקת חשבוניות)

### התקנה
```bash
# Clone הפרויקט
git clone <repository-url>
cd household-budget

# התקנת Backend
cd server
npm install
cp .env.example .env
# ערוך את .env עם ההגדרות שלך
npm run dev

# התקנת Frontend
cd ../client
npm install
npm run dev
```

### גישה
- Frontend: http://localhost:5173
- Backend: http://localhost:7000

## 🌐 העלאה לייצור

ראה את [מדריך ההעלאה](DEPLOYMENT_GUIDE.md) להעלאה מפורטת ל-Vercel + MongoDB Atlas.

## 📝 רישיון

MIT License

## 👨‍💻 פיתוח

הפרויקט פותח עם ❤️ בישראל
