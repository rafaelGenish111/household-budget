import BudgetGoal from '../models/BudgetGoal.js';
import { calculateRemainingBudget } from '../utils/budgetCalculations.js';

// @desc    Get budget goal for a month
// @route   GET /api/goals/:month
// @access  Private
export const getBudgetGoal = async (req, res) => {
    try {
        const { month } = req.params;
        const household = req.user.household;

        let goal = await BudgetGoal.findOne({ household, month });

        if (!goal) {
            // Create empty goal if doesn't exist
            goal = await BudgetGoal.create({
                household,
                month,
                monthlyIncomeGoal: 0,
                categoryGoals: {},
            });
        }

        res.json({
            success: true,
            goal,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create or update budget goal
// @route   POST /api/goals
// @access  Private
export const createOrUpdateBudgetGoal = async (req, res) => {
    try {
        const { month, monthlyIncomeGoal, categoryGoals } = req.body;
        const household = req.user.household;

        let goal = await BudgetGoal.findOne({ household, month });

        if (goal) {
            // Update existing goal
            goal.monthlyIncomeGoal = monthlyIncomeGoal;
            goal.categoryGoals = categoryGoals;
            await goal.save();
        } else {
            // Create new goal
            goal = await BudgetGoal.create({
                household,
                month,
                monthlyIncomeGoal,
                categoryGoals,
            });
        }

        res.json({
            success: true,
            goal,
            message: 'יעדים נשמרו בהצלחה',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get remaining budget for category
// @route   GET /api/goals/:month/remaining/:category
// @access  Private
export const getRemainingBudget = async (req, res) => {
    try {
        const { month, category } = req.params;
        const household = req.user.household;

        const remaining = await calculateRemainingBudget(household, category, month);

        if (!remaining) {
            return res.status(404).json({
                success: false,
                message: 'לא נמצא יעד תקציב לקטגוריה זו',
            });
        }

        res.json({
            success: true,
            category,
            month,
            ...remaining,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

