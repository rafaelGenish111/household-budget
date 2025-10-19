import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// @desc    Get statistics for time range
// @route   GET /api/statistics/range
// @access  Private
export const getTimeRangeStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const household = req.user.household;

        const stats = await Transaction.aggregate([
            {
                $match: {
                    household: new mongoose.Types.ObjectId(household),
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const income = stats.find((s) => s._id === 'income')?.total || 0;
        const expenses = stats.find((s) => s._id === 'expense')?.total || 0;
        const balance = income - expenses;

        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const dailyAverage = days > 0 ? expenses / days : 0;

        res.json({
            success: true,
            totalIncome: income,
            totalExpenses: expenses,
            balance,
            dailyAverage: Math.round(dailyAverage),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get category breakdown
// @route   GET /api/statistics/categories
// @access  Private
export const getCategoryBreakdown = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        const household = req.user.household;

        const match = {
            household: new mongoose.Types.ObjectId(household),
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        };

        if (type) {
            match.type = type;
        }

        const breakdown = await Transaction.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { category: '$category', type: '$type' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    category: '$_id.category',
                    type: '$_id.type',
                    total: 1,
                    count: 1,
                    _id: 0,
                },
            },
            { $sort: { total: -1 } },
        ]);

        res.json({
            success: true,
            breakdown,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get trend data
// @route   GET /api/statistics/trends
// @access  Private
export const getTrendData = async (req, res) => {
    try {
        const { startDate, endDate, groupBy } = req.query;
        const household = req.user.household;

        let dateFormat;
        switch (groupBy) {
            case 'day':
                dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
                break;
            case 'week':
                dateFormat = { $dateToString: { format: '%Y-W%V', date: '$date' } };
                break;
            case 'month':
                dateFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
                break;
            default:
                dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        }

        const trends = await Transaction.aggregate([
            {
                $match: {
                    household: new mongoose.Types.ObjectId(household),
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        date: dateFormat,
                        type: '$type',
                    },
                    total: { $sum: '$amount' },
                },
            },
            {
                $group: {
                    _id: '$_id.date',
                    income: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0],
                        },
                    },
                    expenses: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0],
                        },
                    },
                },
            },
            {
                $project: {
                    date: '$_id',
                    income: 1,
                    expenses: 1,
                    balance: { $subtract: ['$income', '$expenses'] },
                    _id: 0,
                },
            },
            { $sort: { date: 1 } },
        ]);

        res.json({
            success: true,
            trends,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get comparison between periods
// @route   GET /api/statistics/comparison
// @access  Private
export const getComparison = async (req, res) => {
    try {
        const { currentStart, currentEnd, previousStart, previousEnd } = req.query;
        const household = req.user.household;

        const [current, previous] = await Promise.all([
            Transaction.aggregate([
                {
                    $match: {
                        household: new mongoose.Types.ObjectId(household),
                        date: {
                            $gte: new Date(currentStart),
                            $lte: new Date(currentEnd),
                        },
                    },
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' },
                    },
                },
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        household: new mongoose.Types.ObjectId(household),
                        date: {
                            $gte: new Date(previousStart),
                            $lte: new Date(previousEnd),
                        },
                    },
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' },
                    },
                },
            ]),
        ]);

        const currentIncome = current.find((s) => s._id === 'income')?.total || 0;
        const currentExpenses = current.find((s) => s._id === 'expense')?.total || 0;
        const previousIncome = previous.find((s) => s._id === 'income')?.total || 0;
        const previousExpenses = previous.find((s) => s._id === 'expense')?.total || 0;

        const incomeChange = previousIncome > 0
            ? Math.round(((currentIncome - previousIncome) / previousIncome) * 100)
            : 0;
        const expenseChange = previousExpenses > 0
            ? Math.round(((currentExpenses - previousExpenses) / previousExpenses) * 100)
            : 0;
        const savingsChange = (previousIncome - previousExpenses) > 0
            ? Math.round((((currentIncome - currentExpenses) - (previousIncome - previousExpenses)) / (previousIncome - previousExpenses)) * 100)
            : 0;

        res.json({
            success: true,
            currentIncome,
            currentExpenses,
            currentSavings: currentIncome - currentExpenses,
            previousIncome,
            previousExpenses,
            previousSavings: previousIncome - previousExpenses,
            incomeChange,
            expenseChange,
            savingsChange,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
