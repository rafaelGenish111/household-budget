import nodemailer from 'nodemailer';

// הגדרת שירות האימייל (לעתיד)
const createTransporter = () => {
    // בינתיים מחזיר null - יישום בעתיד
    return null;
};

// שליחת אימייל שכחתי סיסמה
export const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('📧 שירות אימייל לא מוגדר - אימייל לא נשלח');
            console.log('🔗 קישור לאיפוס סיסמה:', `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
            return { success: true, message: 'קישור לאיפוס סיסמה נוצר' };
        }

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'איפוס סיסמה - מערכת ניהול משק בית',
            html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>שלום!</h2>
          <p>קיבלת בקשה לאיפוס סיסמה עבור מערכת ניהול משק בית.</p>
          <p>לחץ על הקישור הבא לאיפוס הסיסמה:</p>
          <a href="${resetUrl}" style="background-color: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            איפוס סיסמה
          </a>
          <p>הקישור תקף ל-24 שעות.</p>
          <p>אם לא ביקשת איפוס סיסמה, תוכל להתעלם מהאימייל הזה.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            מערכת ניהול משק בית
          </p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: 'אימייל נשלח בהצלחה' };

    } catch (error) {
        console.error('שגיאה בשליחת אימייל:', error);
        return { success: false, message: 'שגיאה בשליחת אימייל' };
    }
};

// שליחת הזמנה למשק בית
export const sendHouseholdInviteEmail = async (email, householdName, inviteToken) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('📧 שירות אימייל לא מוגדר - הזמנה לא נשלחה');
            console.log('🔗 קישור להצטרפות:', `${process.env.CLIENT_URL}/join-household/${inviteToken}`);
            return { success: true, message: 'קישור להצטרפות נוצר' };
        }

        const inviteUrl = `${process.env.CLIENT_URL}/join-household/${inviteToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `הזמנה להצטרפות למשק בית - ${householdName}`,
            html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>שלום!</h2>
          <p>הוזמנת להצטרף למשק הבית "${householdName}" במערכת ניהול משק בית.</p>
          <p>לחץ על הקישור הבא להצטרפות:</p>
          <a href="${inviteUrl}" style="background-color: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            הצטרף למשק בית
          </a>
          <p>הקישור תקף ל-7 ימים.</p>
          <p>אם לא ציפית להזמנה זו, תוכל להתעלם מהאימייל הזה.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            מערכת ניהול משק בית
          </p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: 'הזמנה נשלחה בהצלחה' };

    } catch (error) {
        console.error('שגיאה בשליחת הזמנה:', error);
        return { success: false, message: 'שגיאה בשליחת הזמנה' };
    }
};

// שליחת התראה על חריגה מתקציב
export const sendBudgetAlertEmail = async (email, categoryName, spent, budget) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('📧 שירות אימייל לא מוגדר - התראה לא נשלחה');
            console.log(`⚠️ חריגה מתקציב: ${categoryName} - הוצא: ₪${spent}, תקציב: ₪${budget}`);
            return { success: true, message: 'התראה נוצרה' };
        }

        const overspendAmount = spent - budget;
        const overspendPercentage = ((overspendAmount / budget) * 100).toFixed(1);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `התראה: חריגה מתקציב - ${categoryName}`,
            html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2 style="color: #f44336;">⚠️ התראה: חריגה מתקציב</h2>
          <p>חריגה מתקציב בקטגוריה: <strong>${categoryName}</strong></p>
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <p><strong>סכום שהוצא:</strong> ₪${spent.toLocaleString()}</p>
            <p><strong>תקציב שהוקצה:</strong> ₪${budget.toLocaleString()}</p>
            <p><strong>חריגה:</strong> ₪${overspendAmount.toLocaleString()} (${overspendPercentage}%)</p>
          </div>
          <p>מומלץ לבדוק את ההוצאות ולהיערך בהתאם.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            מערכת ניהול משק בית
          </p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: 'התראה נשלחה בהצלחה' };

    } catch (error) {
        console.error('שגיאה בשליחת התראה:', error);
        return { success: false, message: 'שגיאה בשליחת התראה' };
    }
};

// שליחת דוח חודשי
export const sendMonthlyReportEmail = async (email, reportData) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('📧 שירות אימייל לא מוגדר - דוח לא נשלח');
            console.log('📊 דוח חודשי:', reportData);
            return { success: true, message: 'דוח נוצר' };
        }

        const { month, income, expenses, balance, topCategories } = reportData;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `דוח חודשי - ${month}`,
            html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>📊 דוח חודשי - ${month}</h2>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h3>סיכום כללי</h3>
            <p><strong>הכנסות:</strong> ₪${income.toLocaleString()}</p>
            <p><strong>הוצאות:</strong> ₪${expenses.toLocaleString()}</p>
            <p><strong>יתרה:</strong> ₪${balance.toLocaleString()}</p>
          </div>

          ${topCategories.length > 0 ? `
          <div style="margin: 15px 0;">
            <h3>קטגוריות מובילות</h3>
            <ul>
              ${topCategories.map(cat => `<li>${cat.name}: ₪${cat.amount.toLocaleString()}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <p>תודה שהשתמשת במערכת ניהול משק בית!</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            מערכת ניהול משק בית
          </p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: 'דוח נשלח בהצלחה' };

    } catch (error) {
        console.error('שגיאה בשליחת דוח:', error);
        return { success: false, message: 'שגיאה בשליחת דוח' };
    }
};
