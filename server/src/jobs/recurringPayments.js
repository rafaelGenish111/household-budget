// import cron from 'node-cron'; // Temporarily disabled due to installation issues
import Saving from '../models/Saving.js';
import Commitment from '../models/Commitment.js';
import Transaction from '../models/Transaction.js';
import Household from '../models/Household.js';

/**
 * פונקציה שמעבדת תשלום חוזר בודד
 * @param {Object} item - החסכון או ההתחייבות
 * @param {String} type - 'saving' או 'commitment'
 */
const processRecurringPayment = async (item, type) => {
    try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // בדיקה: האם היום זה היום הנכון?
        if (currentDay !== item.recurringDay) {
            return null;
        }

        // בדיקה: האם כבר עיבדנו את החודש הזה?
        if (item.lastProcessedDate) {
            const lastProcessed = new Date(item.lastProcessedDate);
            const lastMonth = lastProcessed.getMonth();
            const lastYear = lastProcessed.getFullYear();

            if (lastMonth === currentMonth && lastYear === currentYear) {
                console.log(`⏭️  דילוג: ${item.name} - כבר עובד החודש`);
                return null;
            }
        }

        // קביעת הסכום
        const amount = type === 'saving'
            ? item.monthlyContribution
            : item.monthlyPayment;

        // אם הסכום 0 או שלילי - אין מה לעבד
        if (!amount || amount <= 0) {
            console.log(`⏭️  דילוג: ${item.name} - אין סכום לעיבוד`);
            return null;
        }

        // עבור התחייבות - בדיקה שעדיין יש חוב
        if (type === 'commitment' && item.remaining <= 0) {
            console.log(`⏭️  דילוג: ${item.name} - ההתחייבות שולמה במלואה`);
            return null;
        }

        // מציאת משתמש ראשון במשק הבית (כברירת מחדל)
        const household = await Household.findById(item.household);
        if (!household || !household.members || household.members.length === 0) {
            console.error(`❌ שגיאה: לא נמצא משתמש עבור ${item.name}`);
            return null;
        }
        const userId = household.members[0].user;

        // יצירת Transaction חדשה
        const transactionData = {
            household: item.household,
            type: 'expense',
            category: item.recurringCategory || (type === 'saving' ? 'חסכונות' : 'החזרי הלוואות'),
            subcategory: type === 'saving' ? 'הפקדה חודשית' : 'החזר חודשי',
            amount: amount,
            date: today,
            description: `${type === 'saving' ? '💰 הפקדה אוטומטית' : '📝 תשלום אוטומטי'} - ${item.name}`,
            paymentMethod: 'העברה בנקאית',
            installments: 1,
            installmentAmount: 0,
            user: userId,
        };

        const transaction = await Transaction.create(transactionData);

        // עדכון תאריך עיבוד אחרון
        item.lastProcessedDate = today;
        await item.save();

        console.log(`✅ נוצרה הוצאה: ${item.name} - ₪${amount.toLocaleString()}`);

        return transaction;

    } catch (error) {
        console.error(`❌ שגיאה בעיבוד ${item.name}:`, error.message);
        return null;
    }
};

/**
 * פונקציה ראשית - מעבדת את כל התשלומים החוזרים
 */
export const processAllRecurringPayments = async () => {
    try {
        const today = new Date();
        console.log(`\n🔄 [${today.toLocaleString('he-IL')}] מתחיל עיבוד תשלומים חוזרים...`);

        // שלב 1: מציאת חסכונות עם תשלומים חוזרים
        const recurringSavings = await Saving.find({
            isRecurring: true,
            recurringDay: { $exists: true, $ne: null },
            monthlyContribution: { $gt: 0 },
        });

        // שלב 2: מציאת התחייבויות עם תשלומים חוזרים
        const recurringCommitments = await Commitment.find({
            isRecurring: true,
            recurringDay: { $exists: true, $ne: null },
            monthlyPayment: { $gt: 0 },
            remaining: { $gt: 0 },
        });

        console.log(`📊 נמצאו ${recurringSavings.length} חסכונות ו-${recurringCommitments.length} התחייבויות לבדיקה`);

        let processedCount = 0;

        // שלב 3: עיבוד חסכונות
        for (const saving of recurringSavings) {
            const result = await processRecurringPayment(saving, 'saving');
            if (result) processedCount++;
        }

        // שלב 4: עיבוד התחייבויות
        for (const commitment of recurringCommitments) {
            const result = await processRecurringPayment(commitment, 'commitment');
            if (result) processedCount++;
        }

        console.log(`✅ סיימנו! עובדו ${processedCount} תשלומים חוזרים\n`);

        return processedCount;

    } catch (error) {
        console.error('❌ שגיאה כללית בעיבוד תשלומים חוזרים:', error);
        return 0;
    }
};

/**
 * הפעלת Cron Job - רץ כל יום בחצות ואחת
 * זמנית מושבת עד להתקנת node-cron
 */
export const startRecurringPaymentsJob = () => {
    console.log('⚠️  Recurring Payments Cron Job מושבת זמנית');
    console.log('⚠️  יש להתקין node-cron כדי להפעיל תשלומים אוטומטיים');
    console.log('💡 ניתן להשתמש ב-API endpoint: POST /api/recurring-payments/process-now');

    // TODO: הפעל את זה אחרי התקנת node-cron
    /*
    cron.schedule('1 0 * * *', async () => {
        console.log('\n⏰ ================================');
        console.log('⏰ Cron Job: תשלומים חוזרים התחיל');
        console.log('⏰ ================================');
        await processAllRecurringPayments();
    }, {
        timezone: "Asia/Jerusalem"
    });
    */
};
