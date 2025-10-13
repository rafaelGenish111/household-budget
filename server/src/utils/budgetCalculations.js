import Transaction from '../models/Transaction.js';
import BudgetGoal from '../models/BudgetGoal.js';

export const calculateRemainingBudget = async (household, category, month) => {
    try {
        // Get budget goal for the month
        const budgetGoal = await BudgetGoal.findOne({ household, month });

        if (!budgetGoal || !budgetGoal.categoryGoals.get(category)) {
            return null;
        }

        const categoryBudget = budgetGoal.categoryGoals.get(category);

        // Calculate total spent in category for the month
        const startDate = new Date(month + '-01');
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const spent = await calculateCategoryTotal(household, category, startDate, endDate);

        return {
            budget: categoryBudget,
            spent: spent,
            remaining: categoryBudget - spent,
            percentage: (spent / categoryBudget) * 100,
        };
    } catch (error) {
        console.error('Error calculating remaining budget:', error);
        return null;
    }
};

export const calculateCategoryTotal = async (household, category, startDate, endDate) => {
    try {
        const result = await Transaction.aggregate([
            {
                $match: {
                    household: household,
                    category: category,
                    type: 'expense',
                    date: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        return result.length > 0 ? result[0].total : 0;
    } catch (error) {
        console.error('Error calculating category total:', error);
        return 0;
    }
};

export const calculateMonthlyAverage = async (household, months = 3) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const [income, expenses] = await Promise.all([
            Transaction.aggregate([
                {
                    $match: {
                        household: household,
                        type: 'income',
                        date: { $gte: startDate, $lt: endDate },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                    },
                },
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        household: household,
                        type: 'expense',
                        date: { $gte: startDate, $lt: endDate },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                    },
                },
            ]),
        ]);

        const totalIncome = income.length > 0 ? income[0].total : 0;
        const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;

        return {
            avgIncome: totalIncome / months,
            avgExpenses: totalExpenses / months,
            avgSavings: (totalIncome - totalExpenses) / months,
        };
    } catch (error) {
        console.error('Error calculating monthly average:', error);
        return null;
    }
};

export const getMonthlyTrend = async (household, months = 6) => {
    try {
        const trends = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);

            const [income, expenses] = await Promise.all([
                Transaction.aggregate([
                    {
                        $match: {
                            household: household,
                            type: 'income',
                            date: { $gte: date, $lt: nextDate },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' },
                        },
                    },
                ]),
                Transaction.aggregate([
                    {
                        $match: {
                            household: household,
                            type: 'expense',
                            date: { $gte: date, $lt: nextDate },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' },
                        },
                    },
                ]),
            ]);

            const monthName = date.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });

            trends.push({
                month: monthName,
                income: income.length > 0 ? income[0].total : 0,
                expenses: expenses.length > 0 ? expenses[0].total : 0,
            });
        }

        return trends;
    } catch (error) {
        console.error('Error getting monthly trend:', error);
        return [];
    }
};

