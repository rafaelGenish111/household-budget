import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
    try {
        const { type, category, startDate, endDate, search, page = 1, limit = 50 } = req.query;
        const household = req.user.household;

        // Build query
        const query = { household };

        if (type) query.type = type;
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }

        // Execute query with pagination
        const transactions = await Transaction.find(query)
            .populate('user', 'name')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Transaction.countDocuments(query);

        res.json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('user', 'name');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'תנועה לא נמצאה',
            });
        }

        // Check if transaction belongs to user's household
        if (transaction.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לצפות בתנועה זו',
            });
        }

        res.json({
            success: true,
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
    try {
        const transactionData = {
            ...req.body,
            household: req.user.household,
            user: req.user._id,
        };

        // Calculate installment amount if installments > 1
        if (transactionData.installments > 1) {
            transactionData.installmentAmount = transactionData.amount / transactionData.installments;
        }

        const transaction = await Transaction.create(transactionData);

        res.status(201).json({
            success: true,
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
    try {
        let transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'תנועה לא נמצאה',
            });
        }

        // Check if transaction belongs to user's household
        if (transaction.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לעדכן תנועה זו',
            });
        }

        // Calculate installment amount if needed
        if (req.body.installments > 1 && req.body.amount) {
            req.body.installmentAmount = req.body.amount / req.body.installments;
        }

        transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'תנועה לא נמצאה',
            });
        }

        // Check if transaction belongs to user's household
        if (transaction.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה למחוק תנועה זו',
            });
        }

        await transaction.deleteOne();

        res.json({
            success: true,
            message: 'תנועה נמחקה בהצלחה',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
export const getTransactionSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const household = req.user.household;

        const query = { household };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const summary = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const income = summary.find((s) => s._id === 'income') || { total: 0, count: 0 };
        const expense = summary.find((s) => s._id === 'expense') || { total: 0, count: 0 };

        res.json({
            success: true,
            summary: {
                income: income.total,
                incomeCount: income.count,
                expense: expense.total,
                expenseCount: expense.count,
                balance: income.total - expense.total,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get transactions by category
// @route   GET /api/transactions/by-category
// @access  Private
export const getTransactionsByCategory = async (req, res) => {
    try {
        const { type = 'expense', startDate, endDate } = req.query;
        const household = req.user.household;

        const query = { household, type };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const byCategory = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]);

        res.json({
            success: true,
            byCategory,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

