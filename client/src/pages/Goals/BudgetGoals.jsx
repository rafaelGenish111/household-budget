import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Alert,
    Snackbar,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { fetchGoal, saveGoal } from '../../store/slices/goalsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { fetchSummary, fetchByCategory } from '../../store/slices/transactionsSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const BudgetGoals = () => {
    const dispatch = useDispatch();
    const { currentGoal, isLoading } = useSelector((state) => state.goals);
    const { categories } = useSelector((state) => state.categories);
    const { summary, byCategory } = useSelector((state) => state.transactions);

    const [monthlyIncomeGoal, setMonthlyIncomeGoal] = useState(0);
    const [categoryGoals, setCategoryGoals] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState('');

    useEffect(() => {
        // Get current month
        const now = new Date();
        const month = now.toISOString().slice(0, 7);
        setCurrentMonth(month);

        // Fetch data
        dispatch(fetchGoal(month));
        dispatch(fetchCategories('expense'));
        dispatch(fetchSummary({
            startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
        }));
        dispatch(fetchByCategory({
            type: 'expense',
            startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
        }));
    }, [dispatch]);

    useEffect(() => {
        if (currentGoal) {
            setMonthlyIncomeGoal(currentGoal.monthlyIncomeGoal || 0);
            const goals = {};
            if (currentGoal.categoryGoals) {
                currentGoal.categoryGoals.forEach((value, key) => {
                    goals[key] = value;
                });
            }
            setCategoryGoals(goals);
        }
    }, [currentGoal]);

    const handleCategoryGoalChange = (categoryName, value) => {
        setCategoryGoals((prev) => ({
            ...prev,
            [categoryName]: parseFloat(value) || 0,
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await dispatch(
                saveGoal({
                    month: currentMonth,
                    monthlyIncomeGoal,
                    categoryGoals,
                })
            );
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const expenseCategories = categories
        .filter((cat) => cat.type === 'expense')
        .reduce((unique, cat) => {
            // בדוק אם הקטגוריה כבר קיימת (לפי שם)
            if (!unique.find(c => c.name === cat.name)) {
                unique.push(cat);
            }
            return unique;
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name, 'he'));

    const totalBudget = Object.values(categoryGoals).reduce((sum, val) => sum + val, 0);
    const totalSpent = summary?.expense || 0;
    const remaining = totalBudget - totalSpent;

    const getProgressColor = (percentage) => {
        if (percentage <= 80) return 'success.main';
        if (percentage <= 100) return 'warning.main';
        return 'error.main';
    };

    const getCategorySpent = (categoryName) => {
        const cat = byCategory.find((c) => c._id === categoryName);
        return cat ? cat.total : 0;
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                יעדי תקציב
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
                הגדר יעדים חודשיים ועקוב אחר התקדמותך
            </Typography>

            {/* Monthly Income Goal */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    יעד הכנסה חודשי
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="יעד הכנסה"
                            value={monthlyIncomeGoal}
                            onChange={(e) => setMonthlyIncomeGoal(parseFloat(e.target.value) || 0)}
                            InputProps={{ startAdornment: '₪' }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                            הכנסה בפועל החודש: ₪{(summary?.income || 0).toLocaleString()}
                        </Typography>
                        {monthlyIncomeGoal > 0 && (
                            <Typography
                                variant="body2"
                                color={
                                    summary?.income >= monthlyIncomeGoal
                                        ? 'success.main'
                                        : 'warning.main'
                                }
                            >
                                {summary?.income >= monthlyIncomeGoal ? '✅ ' : '⚠️ '}
                                {((summary?.income / monthlyIncomeGoal) * 100).toFixed(1)}% מהיעד
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Budget Summary */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                תקציב כולל
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary.main">
                                ₪{totalBudget.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                הוצא עד כה
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                                ₪{totalSpent.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                יתרה
                            </Typography>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color={remaining >= 0 ? 'success.main' : 'error.main'}
                            >
                                {remaining >= 0 ? '' : '-'}₪{Math.abs(remaining).toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Category Goals */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    תקציב לפי קטגוריה
                </Typography>
                <Grid container spacing={3}>
                    {expenseCategories.map((category) => {
                        const budget = categoryGoals[category.name] || 0;
                        const spent = getCategorySpent(category.name);
                        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                        const remaining = budget - spent;

                        return (
                            <Grid item xs={12} key={category._id}>
                                <Box>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                label={category.name}
                                                value={categoryGoals[category.name] || ''}
                                                onChange={(e) =>
                                                    handleCategoryGoalChange(category.name, e.target.value)
                                                }
                                                InputProps={{ startAdornment: '₪' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={8}>
                                            <Box>
                                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {spent > 0 && budget > 0 && (
                                                            <>
                                                                הוצא: ₪{spent.toLocaleString()} ({percentage.toFixed(1)}%)
                                                            </>
                                                        )}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight="bold"
                                                        color={
                                                            remaining >= 0 && budget > 0
                                                                ? getProgressColor(percentage)
                                                                : budget > 0
                                                                    ? 'error.main'
                                                                    : 'text.secondary'
                                                        }
                                                    >
                                                        {budget > 0 ? (
                                                            remaining >= 0 ? (
                                                                `נותר: ₪${remaining.toLocaleString()}`
                                                            ) : (
                                                                `חריגה: ₪${Math.abs(remaining).toLocaleString()}`
                                                            )
                                                        ) : (
                                                            'לא הוגדר תקציב'
                                                        )}
                                                    </Typography>
                                                </Box>
                                                {budget > 0 && (
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={Math.min(percentage, 100)}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: 'grey.200',
                                                            '& .MuiLinearProgress-bar': {
                                                                bgcolor: getProgressColor(percentage),
                                                            },
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>

                <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'שומר...' : 'שמור יעדים'}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    יעדים נשמרו בהצלחה! ✅
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BudgetGoals;

