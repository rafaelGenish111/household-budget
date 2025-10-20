import Debt from '../models/Debt.js';
import mongoose from 'mongoose';

export const getDebts = async (req, res) => {
    try {
        const { type, status, category } = req.query;
        const household = req.user.household;

        const query = { household };
        if (type) query.type = type;
        if (status) query.status = status;
        if (category) query.category = category;

        const debts = await Debt.find(query).populate('user', 'name').sort({ createdAt: -1 });

        for (const debt of debts) {
            if (debt.checkOverdue()) {
                await debt.save();
            }
        }

        res.json({ success: true, count: debts.length, debts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDebt = async (req, res) => {
    try {
        const debt = await Debt.findById(req.params.id).populate('user', 'name');
        if (!debt) return res.status(404).json({ success: false, message: 'חוב לא נמצא' });
        if (debt.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({ success: false, message: 'אין הרשאה לצפות בחוב זה' });
        }
        if (debt.checkOverdue()) await debt.save();
        res.json({ success: true, debt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDebt = async (req, res) => {
    try {
        const debtData = { ...req.body, household: req.user.household, user: req.user._id };
        const debt = await Debt.create(debtData);
        res.status(201).json({ success: true, debt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDebt = async (req, res) => {
    try {
        let debt = await Debt.findById(req.params.id);
        if (!debt) return res.status(404).json({ success: false, message: 'חוב לא נמצא' });
        if (debt.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({ success: false, message: 'אין הרשאה לעדכן חוב זה' });
        }
        debt = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, debt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDebt = async (req, res) => {
    try {
        const debt = await Debt.findById(req.params.id);
        if (!debt) return res.status(404).json({ success: false, message: 'חוב לא נמצא' });
        if (debt.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({ success: false, message: 'אין הרשאה למחוק חוב זה' });
        }
        await debt.deleteOne();
        res.json({ success: true, message: 'חוב נמחק בהצלחה' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addPayment = async (req, res) => {
    try {
        const { amount, note, paymentMethod } = req.body;
        const debt = await Debt.findById(req.params.id);
        if (!debt) return res.status(404).json({ success: false, message: 'חוב לא נמצא' });
        if (debt.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({ success: false, message: 'אין הרשאה לעדכן חוב זה' });
        }
        await debt.addPayment(amount, note, paymentMethod);
        res.json({ success: true, debt, message: 'תשלום נוסף בהצלחה' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getDebtsSummary = async (req, res) => {
    try {
        const summary = await Debt.getSummary(req.user.household);
        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUpcomingDebts = async (req, res) => {
    try {
        const household = req.user.household;
        const daysAhead = parseInt(req.query.days) || 30;
        const upcomingDate = new Date();
        upcomingDate.setDate(upcomingDate.getDate() + daysAhead);

        const debts = await Debt.find({
            household,
            status: 'active',
            dueDate: { $gte: new Date(), $lte: upcomingDate },
        })
            .populate('user', 'name')
            .sort({ dueDate: 1 });
        res.json({ success: true, count: debts.length, debts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


