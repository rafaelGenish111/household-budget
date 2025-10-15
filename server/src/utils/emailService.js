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
    const inviteUrl = `${process.env.CLIENT_URL}/join/${inviteToken}`;

    if (!transporter) {
      // 📧 מצב ידני - הצגה ב-console
      console.log('\n' + '='.repeat(60));
      console.log('📧 הזמנה חדשה למשק בית');
      console.log('='.repeat(60));
      console.log(`👤 אימייל המוזמן: ${email}`);
      console.log(`🏠 שם משק הבית: ${householdName}`);
      console.log(`🔗 קישור להצטרפות:\n   ${inviteUrl}`);
      console.log('='.repeat(60));
      console.log('💡 העתק את הקישור ושלח אותו למשתמש ידנית');
      console.log('='.repeat(60) + '\n');

      return {
        success: true,
        message: 'קישור להצטרפות נוצר',
        inviteUrl
      };
    }

    // אם יש transporter - שליחת מייל אמיתי
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@household-budget.com',
      to: email,
      subject: `הזמנה להצטרפות למשק בית - ${householdName}`,
      html: `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2196f3;">שלום!</h2>
                    <p style="font-size: 16px;">הוזמנת להצטרף למשק הבית <strong>"${householdName}"</strong> במערכת ניהול משק בית.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteUrl}" 
                           style="background-color: #4caf50; 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  font-size: 18px;
                                  display: inline-block;">
                            הצטרף למשק בית
                        </a>
                    </div>
                    
                    <p style="color: #666;">הקישור תקף ל-7 ימים.</p>
                    <p style="color: #666; font-size: 14px;">אם לא ציפית להזמנה זו, תוכל להתעלם מהאימייל הזה.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        מערכת ניהול משק בית
                    </p>
                </div>
            `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'אימייל נשלח בהצלחה' };

  } catch (error) {
    console.error('❌ שגיאה בשליחת אימייל:', error);
    return { success: false, message: 'שגיאה בשליחת אימייל' };
  }
};

// ייצוא נוסף
export const isEmailServiceEnabled = () => {
  return createTransporter() !== null;
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
