import Commitment from '../models/Commitment.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const processRecurringTransactions = async (date = new Date()) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const commitments = await Commitment.find({ isActive: true, autoCreateTransaction: true, remaining: { $gt: 0 } }).session(session);

        const results = { checked: commitments.length, created: 0, skipped: 0, errors: 0, transactions: [] };

        for (const commitment of commitments) {
            try {
                if (!commitment.shouldCreateTransaction(date)) {
                    results.skipped++;
                    continue;
                }

                const amount = Math.min(commitment.monthlyPayment, commitment.remaining);

                const [tx] = await Transaction.create([
                    {
                        household: commitment.household,
                        type: 'expense',
                        category: commitment.category,
                        subcategory: commitment.subcategory,
                        amount,
                        date,
                        description: `${commitment.name} - תשלום אוטומטי`,
                        paymentMethod: commitment.paymentMethod,
                    },
                ], { session });

                commitment.remaining -= amount;
                commitment.paymentsLeft = Math.max(0, Math.ceil(commitment.remaining / (commitment.monthlyPayment || amount)));
                commitment.lastTransactionDate = date;
                if (commitment.remaining <= 0) {
                    commitment.isActive = false;
                    commitment.paymentsLeft = 0;
                }
                await commitment.save({ session });

                results.created++;
                results.transactions.push({ id: tx._id, name: commitment.name, amount });
            } catch (e) {
                results.errors++;
            }
        }

        await session.commitTransaction();
        return results;
    } catch (e) {
        await session.abortTransaction();
        throw e;
    } finally {
        session.endSession();
    }
};

export const backfillRecurringTransactions = async (year, month) => {
    const days = new Date(year, month + 1, 0).getDate();
    const totals = { totalChecked: 0, totalCreated: 0 };
    for (let d = 1; d <= days; d++) {
        const res = await processRecurringTransactions(new Date(year, month, d));
        totals.totalChecked += res.checked;
        totals.totalCreated += res.created;
    }
    return totals;
};

export const getUpcomingRecurring = async (daysAhead = 7) => {
    const today = new Date();
    const currentDay = today.getDate();
    const commitments = await Commitment.find({ isActive: true, autoCreateTransaction: true, remaining: { $gt: 0 } }).lean();
    return commitments
        .map((c) => {
            let daysUntilBilling;
            if (c.billingDay >= currentDay) daysUntilBilling = c.billingDay - currentDay;
            else {
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, c.billingDay);
                daysUntilBilling = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }
            return { ...c, daysUntilBilling };
        })
        .filter((c) => c.daysUntilBilling <= daysAhead)
        .sort((a, b) => a.daysUntilBilling - b.daysUntilBilling);
};


