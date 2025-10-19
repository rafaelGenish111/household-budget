import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    LinearProgress,
    Divider
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    TrendingFlat,
    AttachMoney,
    MoneyOff,
    Savings
} from '@mui/icons-material';
import {
    formatCurrency,
    formatPercentage,
    getChangeColor,
    getChangeDirection
} from '../../services/statisticsService';

const ComparisonCard = ({
    data,
    loading,
    error,
    title = 'השוואה לתקופה קודמת'
}) => {
    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {title}
                    </Typography>
                    <LinearProgress />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {title}
                    </Typography>
                    <Typography color="error">
                        שגיאה בטעינת נתוני ההשוואה
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {title}
                    </Typography>
                    <Typography color="text.secondary">
                        אין נתונים להשוואה
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const {
        currentIncome,
        currentExpenses,
        currentSavings,
        previousIncome,
        previousExpenses,
        previousSavings,
        incomeChange,
        expenseChange,
        savingsChange
    } = data;

    const getChangeIcon = (value) => {
        const direction = getChangeDirection(value);
        switch (direction) {
            case 'up': return <TrendingUp />;
            case 'down': return <TrendingDown />;
            default: return <TrendingFlat />;
        }
    };

    const getChangeChip = (value, label, isExpense = false) => {
        const direction = getChangeDirection(value);
        const color = getChangeColor(value, isExpense);

        return (
            <Chip
                icon={getChangeIcon(value)}
                label={`${label}: ${formatPercentage(value)}`}
                size="small"
                sx={{
                    color: color,
                    borderColor: color,
                    '& .MuiChip-icon': {
                        color: color,
                    },
                }}
                variant="outlined"
            />
        );
    };

    const getProgressValue = (current, previous) => {
        if (previous === 0) return 0;
        return Math.min((current / previous) * 100, 200); // Cap at 200% for display
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>

                {/* Current vs Previous Summary */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            תקופה נוכחית
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            תקופה קודמת
                        </Typography>
                    </Box>

                    {/* Income Comparison */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <AttachMoney color="success" fontSize="small" />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                                הכנסות
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(currentIncome)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                vs {formatCurrency(previousIncome)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={getProgressValue(currentIncome, previousIncome)}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'success.light',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'success.main',
                                },
                            }}
                        />
                    </Box>

                    {/* Expenses Comparison */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <MoneyOff color="error" fontSize="small" />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                                הוצאות
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(currentExpenses)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                vs {formatCurrency(previousExpenses)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={getProgressValue(currentExpenses, previousExpenses)}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'error.light',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'error.main',
                                },
                            }}
                        />
                    </Box>

                    {/* Savings Comparison */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Savings color="primary" fontSize="small" />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                                חיסכון
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(currentSavings)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                vs {formatCurrency(previousSavings)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={getProgressValue(currentSavings, previousSavings)}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'primary.light',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'primary.main',
                                },
                            }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Change Indicators */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        שינוי מהתקופה הקודמת:
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {getChangeChip(incomeChange, 'הכנסות')}
                        {getChangeChip(expenseChange, 'הוצאות', true)}
                        {getChangeChip(savingsChange, 'חיסכון')}
                    </Box>
                </Box>

                {/* Summary Message */}
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                        {savingsChange > 0 ? (
                            <>🎉 מצוין! שיפרת את החיסכון ב-{formatPercentage(savingsChange)}</>
                        ) : savingsChange < 0 ? (
                            <>⚠️ החיסכון ירד ב-{formatPercentage(Math.abs(savingsChange))}</>
                        ) : (
                            <>📊 החיסכון נשאר זהה לתקופה הקודמת</>
                        )}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ComparisonCard;
