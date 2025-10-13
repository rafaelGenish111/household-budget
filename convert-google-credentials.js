// סקריפט להמרת קובץ Google Cloud credentials ל-string עבור Vercel
const fs = require('fs');
const path = require('path');

const credentialsFile = './server/household-budget-key.json';

if (!fs.existsSync(credentialsFile)) {
    console.log('❌ קובץ המפתחות לא נמצא:', credentialsFile);
    console.log('📁 ודא שהקובץ קיים בתיקיית server/');
    process.exit(1);
}

try {
    const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
    const credentialsString = JSON.stringify(credentials);

    console.log('🔑 Google Cloud Credentials מוכנים ל-Vercel:');
    console.log('='.repeat(80));
    console.log(credentialsString);
    console.log('='.repeat(80));
    console.log('');
    console.log('📋 הוראות:');
    console.log('1. העתק את הטקסט למעלה');
    console.log('2. לך ל-Vercel Dashboard → Settings → Environment Variables');
    console.log('3. הוסף משתנה חדש:');
    console.log('   Name: GOOGLE_APPLICATION_CREDENTIALS');
    console.log('   Value: [הדבק את הטקסט כאן]');
    console.log('   Environment: Production');
    console.log('');
    console.log('✅ סיימת!');

} catch (error) {
    console.error('❌ שגיאה בקריאת קובץ המפתחות:', error.message);
    process.exit(1);
}
