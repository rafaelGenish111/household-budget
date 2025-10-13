import Transaction from '../models/Transaction.js';
import BudgetGoal from '../models/BudgetGoal.js';
import { calculateCategoryTotal } from './budgetCalculations.js';

export const generateRecommendations = async (household, currentMonth) => {
    const recommendations = [];

    try {
        // Get current month dates
        const startDate = new Date(currentMonth + '-01');
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Get previous month dates
        const prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        const prevEndDate = new Date(startDate);

        // 1. Check budget overruns
        const budgetGoal = await BudgetGoal.findOne({ household, month: currentMonth });

        if (budgetGoal && budgetGoal.categoryGoals) {
            for (const [category, budget] of budgetGoal.categoryGoals) {
                const spent = await calculateCategoryTotal(household, category, startDate, endDate);
                const percentage = (spent / budget) * 100;

                if (percentage > 100) {
                    recommendations.push({
                        type: 'warning',
                        category: category,
                        message: `חרגת מהתקציב בקטגוריית ${category} ב-${(percentage - 100).toFixed(1)}%`,
                        priority: 'high',
                    });
                } else if (percentage > 80) {
                    recommendations.push({
                        type: 'warning',
                        category: category,
                        message: `הוצאת ${percentage.toFixed(1)}% מהתקציב בקטגוריית ${category}`,
                        priority: 'medium',
                    });
                }
            }
        }

        // 2. Compare to previous month - detect sharp increases
        const categories = await Transaction.distinct('category', {
            household,
            type: 'expense',
            date: { $gte: startDate, $lt: endDate },
        });

        for (const category of categories) {
            const currentSpent = await calculateCategoryTotal(household, category, startDate, endDate);
            const prevSpent = await calculateCategoryTotal(household, category, prevStartDate, prevEndDate);

            if (prevSpent > 0) {
                const increase = ((currentSpent - prevSpent) / prevSpent) * 100;

                if (increase > 30) {
                    recommendations.push({
                        type: 'info',
                        category: category,
                        message: `הוצאות בקטגוריית ${category} עלו ב-${increase.toFixed(1)}% לעומת החודש הקודם`,
                        priority: 'medium',
                    });
                }
            }
        }

        // 3. Savings opportunity
        const [income, expenses] = await Promise.all([
            Transaction.aggregate([
                {
                    $match: {
                        household,
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
                        household,
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
        const balance = totalIncome - totalExpenses;

        if (balance > totalIncome * 0.2) {
            recommendations.push({
                type: 'success',
                category: 'כללי',
                message: `מעולה! חסכת ${balance.toFixed(0)} ₪ החודש (${((balance / totalIncome) * 100).toFixed(1)}% מההכנסות)`,
                priority: 'low',
            });
        } else if (balance < 0) {
            recommendations.push({
                type: 'warning',
                category: 'כללי',
                message: `שים לב! ההוצאות עלו על ההכנסות ב-${Math.abs(balance).toFixed(0)} ₪`,
                priority: 'high',
            });
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return recommendations;
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return [];
    }
};

