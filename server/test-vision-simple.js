// בדיקה פשוטה של Google Cloud Vision API
import vision from '@google-cloud/vision';
import fs from 'fs';

console.log('🔧 משתנה סביבה GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('❌ משתנה הסביבה לא מוגדר');
    process.exit(1);
}

if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.log('❌ קובץ המפתחות לא נמצא:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    process.exit(1);
}

console.log('✅ קובץ המפתחות קיים');

try {
    const client = new vision.ImageAnnotatorClient();
    console.log('✅ לקוח Google Cloud Vision נוצר בהצלחה');

    // נסה לזהות טקסט בתמונה פשוטה
    const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const [result] = await client.textDetection(imageBuffer);
    console.log('✅ Vision API עובד!');
    console.log('📝 תוצאה:', result.textAnnotations?.length || 0, 'הערות טקסט');

} catch (error) {
    console.error('❌ שגיאה:', error.message);
    console.error('🔍 קוד שגיאה:', error.code);
    console.error('📋 פרטים:', error.details);
}
