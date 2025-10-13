#!/bin/bash

echo "🚀 הכנת הפרויקט להעלאה ל-Vercel..."

# בדיקה שהפרויקט קיים
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "❌ שגיאה: לא נמצאו תיקיות server או client"
    exit 1
fi

echo "✅ מבנה הפרויקט תקין"

# יצירת .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.production
.env.development

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js build output
.next

# Nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Vercel
.vercel

# Google Cloud credentials
*.json
!package.json
!package-lock.json

# Uploads
server/uploads/*
!server/uploads/.gitkeep

# Build outputs
client/dist/
client/build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

echo "✅ יצרתי .gitignore"

# יצירת README מעודכן
cat > README.md << 'EOF'
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
EOF

echo "✅ יצרתי README מעודכן"

# יצירת תיקיית uploads
mkdir -p server/uploads
touch server/uploads/.gitkeep

echo "✅ יצרתי תיקיית uploads"

# יצירת קובץ .gitkeep לתיקיות ריקות
touch server/uploads/.gitkeep

echo "✅ הכנת הפרויקט הושלמה!"
echo ""
echo "📋 השלבים הבאים:"
echo "1. ערוך את קובץ server/.env עם ההגדרות שלך"
echo "2. ערוך את קובץ client/.env.production עם URL השרת שלך"
echo "3. צור repository ב-GitHub והעלה את הקוד"
echo "4. עקוב אחר מדריך ההעלאה: DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 בהצלחה!"
