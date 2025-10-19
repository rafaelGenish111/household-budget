import express from 'express';
import { auth } from '../middleware/auth.js';
import { processAllRecurringPayments } from '../jobs/recurringPayments.js';

const router = express.Router();

// Route לבדיקה ידנית - רק למשתמשים מחוברים
router.post('/process-now', auth, async (req, res) => {
    try {
        console.log('🔧 הפעלה ידנית של עיבוד תשלומים חוזרים...');
        const processedCount = await processAllRecurringPayments();
        
        res.json({
            success: true,
            message: `עובדו ${processedCount} תשלומים בהצלחה`,
            processedCount,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'שגיאה בעיבוד תשלומים',
            error: error.message,
        });
    }
});

export default router;
