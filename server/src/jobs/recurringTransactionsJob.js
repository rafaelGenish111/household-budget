import cron from 'node-cron';
import { processRecurringTransactions } from '../services/recurringTransactionsService.js';

export const startRecurringTransactionsJob = () => {
    const job = cron.schedule('5 0 * * *', async () => {
        try {
            await processRecurringTransactions();
        } catch (e) {
            console.error('recurringTransactions cron error', e.message);
        }
    }, { scheduled: true, timezone: 'Asia/Jerusalem' });
    return job;
};

export const startHourlyCheckJob = () => {
    const job = cron.schedule('5 * * * *', async () => {
        const now = new Date();
        const h = now.getHours();
        if (h >= 0 && h < 6) {
            try { await processRecurringTransactions(); } catch { }
        }
    }, { scheduled: true, timezone: 'Asia/Jerusalem' });
    return job;
};


