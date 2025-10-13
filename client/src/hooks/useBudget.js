import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchGoals, createGoal, updateGoal } from '../store/slices/goalsSlice';
import { fetchSummary } from '../store/slices/transactionsSlice';
import { calculateBalance, calculateCategoryRemaining, isOverBudget } from '../utils/calculations';

export const useBudget = (month = null) => {
    const dispatch = useDispatch();
    const { goals, isLoading: goalsLoading } = useSelector((state) => state.goals);
    const { summary, isLoading: summaryLoading } = useSelector((state) => state.transactions);

    const currentMonth = month || new Date().toISOString().slice(0, 7);

    useEffect(() => {
        dispatch(fetchGoals(currentMonth));
        dispatch(fetchSummary({
            startDate: new Date(currentMonth + '-01').toISOString(),
            endDate: new Date(currentMonth + '-31').toISOString()
        }));
    }, [dispatch, currentMonth]);

    const getCurrentGoal = () => {
        return goals.find(goal => goal.month === currentMonth);
    };

    const getCategoryRemaining = (category) => {
        const goal = getCurrentGoal();
        if (!goal || !goal.categoryGoals[category]) return null;

        const spent = summary?.byCategory?.find(cat => cat._id === category)?.total || 0;
        return calculateCategoryRemaining(goal.categoryGoals[category], spent);
    };

    const getCategoryStatus = (category) => {
        const goal = getCurrentGoal();
        if (!goal || !goal.categoryGoals[category]) return 'no-budget';

        const spent = summary?.byCategory?.find(cat => cat._id === category)?.total || 0;
        const budget = goal.categoryGoals[category];

        if (isOverBudget(spent, budget)) return 'over-budget';
        if (spent > budget * 0.8) return 'warning';
        return 'good';
    };

    const getTotalRemaining = () => {
        const goal = getCurrentGoal();
        if (!goal) return null;

        const totalBudget = Object.values(goal.categoryGoals).reduce((sum, budget) => sum + (budget || 0), 0);
        const totalSpent = summary?.expense || 0;

        return calculateBalance(totalBudget, totalSpent);
    };

    const saveGoal = async (goalData) => {
        try {
            const existingGoal = getCurrentGoal();
            if (existingGoal) {
                await dispatch(updateGoal({ id: existingGoal._id, data: goalData }));
            } else {
                await dispatch(createGoal({ ...goalData, month: currentMonth }));
            }
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'שגיאה בשמירת יעד'
            };
        }
    };

    const getMonthlyBalance = () => {
        return calculateBalance(summary?.income || 0, summary?.expense || 0);
    };

    const getIncomeGoalProgress = () => {
        const goal = getCurrentGoal();
        if (!goal || !goal.monthlyIncomeGoal) return null;

        const actualIncome = summary?.income || 0;
        const goalIncome = goal.monthlyIncomeGoal;

        return {
            actual: actualIncome,
            goal: goalIncome,
            percentage: Math.min((actualIncome / goalIncome) * 100, 100),
            isAchieved: actualIncome >= goalIncome
        };
    };

    return {
        currentGoal: getCurrentGoal(),
        summary,
        isLoading: goalsLoading || summaryLoading,
        getCategoryRemaining,
        getCategoryStatus,
        getTotalRemaining,
        saveGoal,
        getMonthlyBalance,
        getIncomeGoalProgress,
        currentMonth
    };
};
