#!/bin/bash

# הגדרת משתנה הסביבה ל-Google Cloud Vision
export GOOGLE_APPLICATION_CREDENTIALS="/Users/bestflow/Documents/projects/household-budget/server/household-budget-475002-c736afd7a9ff.json"

echo "🔧 הגדרת Google Cloud Vision API..."
echo "📁 קובץ המפתחות: $GOOGLE_APPLICATION_CREDENTIALS"

# בדיקה שהקובץ קיים
if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "✅ קובץ המפתחות קיים"
else
    echo "❌ קובץ המפתחות לא נמצא: $GOOGLE_APPLICATION_CREDENTIALS"
    exit 1
fi

echo "🚀 מפעיל את השרת..."
npm run dev
