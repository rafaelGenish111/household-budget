import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Alert,
    AlertTitle,
    Card,
    CardContent,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    AccountBalance,
    Savings as SavingsIcon,
    Assignment as CommitmentsIcon,
    Warning,
    Info,
    CheckCircle,
    Timeline,
    Compare,
} from '@mui/icons-material';
import { PieChart, LineChart } from '../../components/charts';
import { fetchSummary, fetchByCategory } from '../../store/slices/transactionsSlice';
import { fetchSavings } from '../../store/slices/savingsSlice';
import { aiService } from '../../services/aiService';
import StatCard from '../../components/common/StatCard';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TimeRangeSelector from '../../components/dashboard/TimeRangeSelector';
import TrendChart from '../../components/charts/TrendChart';
import ComparisonCard from '../../components/dashboard/ComparisonCard';
import { useTimeRange } from '../../hooks/useTimeRange';
import {
    getTimeRangeStats,
    getCategoryBreakdown,
    getTrendData,
    getComparison,
    getPreviousPeriodDates,
    formatCurrency
} from '../../services/statisticsService';


const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { summary, byCategory, isLoading } = useSelector((state) => state.transactions);
    const { savings } = useSelector((state) => state.savings);
    const [recommendations, setRecommendations] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);

    // New state for enhanced dashboard
    const [timeRangeStats, setTimeRangeStats] = useState(null);
    const [categoryBreakdown, setCategoryBreakdown] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [comparisonData, setComparisonData] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [error, setError] = useState(null);

    // Time range hook
    const { timeRangeConfig, currentRange } = useTimeRange();

    // Fetch enhanced statistics
    const fetchStatistics = async () => {
        setLoadingStats(true);
        setError(null);

        try {
            const startDate = timeRangeConfig.start.toISOString().split('T')[0];
            const endDate = timeRangeConfig.end.toISOString().split('T')[0];

            // Fetch all statistics in parallel
            const [statsResponse, categoryResponse, trendResponse] = await Promise.all([
                getTimeRangeStats(startDate, endDate),
                getCategoryBreakdown(startDate, endDate, 'expense'),
                getTrendData(startDate, endDate, timeRangeConfig.groupBy)
            ]);

            setTimeRangeStats(statsResponse.data);
            setCategoryBreakdown(categoryResponse.data.breakdown || []);
            setTrendData(trendResponse.data.trends || []);

            // Fetch comparison data
            const { previousStart, previousEnd } = getPreviousPeriodDates(startDate, endDate, currentRange);
            const comparisonResponse = await getComparison(startDate, endDate, previousStart, previousEnd);
            setComparisonData(comparisonResponse.data);

        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError('שגיאה בטעינת נתוני הסטטיסטיקות');
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, [timeRangeConfig, currentRange]);

    useEffect(() => {
        // Get current month for legacy data
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);

        // Fetch legacy data for backward compatibility
        dispatch(fetchSummary({
            startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
        }));
        dispatch(fetchByCategory({
            type: 'expense',
            startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
        }));
        dispatch(fetchSavings());

        // Fetch AI recommendations
        aiService.getRecommendations(currentMonth).then((response) => {
            setRecommendations(response.recommendations || []);
        }).catch(() => {
            setRecommendations([]);
        });

        // Fetch monthly trend (mock for now - will implement properly)
        const trendData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('he-IL', { month: 'short' });
            trendData.push({
                month: monthName,
                income: Math.random() * 15000 + 10000,
                expenses: Math.random() * 12000 + 8000,
            });
        }
        setMonthlyTrend(trendData);
    }, [dispatch]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const totalSavings = savings.reduce((sum, s) => sum + s.current, 0);

    // Use enhanced stats if available, fallback to legacy
    const displayStats = timeRangeStats || {
        totalIncome: summary?.income || 0,
        totalExpenses: summary?.expense || 0,
        balance: (summary?.income || 0) - (summary?.expense || 0),
        dailyAverage: 0
    };

    // Prepare pie chart data - use enhanced category data if available
    const pieData = (categoryBreakdown.length > 0 ? categoryBreakdown : byCategory).map((cat) => ({
        name: cat.category || cat._id,
        value: cat.total,
    }));

    const getAlertIcon = (type) => {
        switch (type) {
            case 'warning':
                return <Warning />;
            case 'success':
                return <CheckCircle />;
            case 'info':
            default:
                return <Info />;
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                לוח בקרה
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
                סקירה כללית של המצב הכלכלי שלך
            </Typography>

            {/* Time Range Selector */}
            <TimeRangeSelector />

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Enhanced Stats Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title={`הכנסות ${timeRangeConfig.label}`}
                        value={formatCurrency(displayStats.totalIncome)}
                        icon={<TrendingUp sx={{ color: 'white' }} />}
                        color="#4caf50"
                        onClick={() => navigate('/transactions?type=income')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title={`הוצאות ${timeRangeConfig.label}`}
                        value={formatCurrency(displayStats.totalExpenses)}
                        icon={<TrendingDown sx={{ color: 'white' }} />}
                        color="#f44336"
                        onClick={() => navigate('/transactions?type=expense')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="יתרה"
                        value={formatCurrency(displayStats.balance)}
                        icon={<AccountBalance sx={{ color: 'white' }} />}
                        color={displayStats.balance >= 0 ? '#2196f3' : '#ff9800'}
                        onClick={() => navigate('/transactions')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title={displayStats.dailyAverage > 0 ? "ממוצע יומי" : "סך חסכונות"}
                        value={displayStats.dailyAverage > 0 ? formatCurrency(displayStats.dailyAverage) : formatCurrency(totalSavings)}
                        icon={displayStats.dailyAverage > 0 ? <Timeline sx={{ color: 'white' }} /> : <SavingsIcon sx={{ color: 'white' }} />}
                        color={displayStats.dailyAverage > 0 ? "#ff9800" : "#9c27b0"}
                        onClick={() => navigate(displayStats.dailyAverage > 0 ? '/transactions' : '/savings')}
                    />
                </Grid>
            </Grid>

            {/* Enhanced Charts and Analysis */}
            <Grid container spacing={3} mb={4}>
                {/* Trend Chart */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <TrendChart
                                data={trendData}
                                loading={loadingStats}
                                error={error}
                                title={`מגמות ${timeRangeConfig.label}`}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Comparison Card */}
                <Grid item xs={12} md={4}>
                    <ComparisonCard
                        data={comparisonData}
                        loading={loadingStats}
                        error={error}
                        title="השוואה לתקופה קודמת"
                    />
                </Grid>
            </Grid>

            {/* Category Breakdown */}
            <Grid container spacing={3} mb={4}>
                {/* Pie Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 }}
                            onClick={() => navigate('/transactions?type=expense')}
                        >
                            התפלגות הוצאות לפי קטגוריה
                        </Typography>
                        <PieChart
                            data={pieData}
                            onSliceClick={(categoryName) =>
                                navigate(`/transactions?type=expense&category=${encodeURIComponent(categoryName)}`)
                            }
                        />
                    </Paper>
                </Grid>

                {/* Legacy Line Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 }}
                            onClick={() => navigate('/transactions')}
                        >
                            מגמה חודשית (לשם השוואה)
                        </Typography>
                        <LineChart data={monthlyTrend} />
                    </Paper>
                </Grid>
            </Grid>

            {/* AI Recommendations */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    המלצות והתראות
                </Typography>
                <Grid container spacing={2}>
                    {recommendations.length > 0 ? (
                        recommendations.map((rec, index) => (
                            <Grid item xs={12} key={index}>
                                <Alert
                                    severity={rec.type}
                                    icon={getAlertIcon(rec.type)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <AlertTitle>{rec.category}</AlertTitle>
                                    {rec.message}
                                </Alert>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Alert severity="success" sx={{ borderRadius: 2 }}>
                                <AlertTitle>מצוין!</AlertTitle>
                                אין התראות כרגע. המשך את הניהול הטוב של התקציב שלך! 💪
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

export default Dashboard;

