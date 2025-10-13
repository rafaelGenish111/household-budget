import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Alert,
    AlertTitle,
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
} from '@mui/icons-material';
import { PieChart, LineChart } from '../../components/charts';
import { fetchSummary, fetchByCategory } from '../../store/slices/transactionsSlice';
import { fetchSavings } from '../../store/slices/savingsSlice';
import { aiService } from '../../services/aiService';
import StatCard from '../../components/common/StatCard';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';


const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { summary, byCategory, isLoading } = useSelector((state) => state.transactions);
    const { savings } = useSelector((state) => state.savings);
    const [recommendations, setRecommendations] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);

    useEffect(() => {
        // Get current month
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);

        // Fetch all data
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
        // For now, create mock data
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
    const balance = (summary?.income || 0) - (summary?.expense || 0);

    // Prepare pie chart data
    const pieData = byCategory.map((cat) => ({
        name: cat._id,
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

            {/* Stats Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="הכנסות החודש"
                        value={`₪${(summary?.income || 0).toLocaleString()}`}
                        icon={<TrendingUp sx={{ color: 'white' }} />}
                        color="#4caf50"
                        onClick={() => navigate('/transactions?type=income')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="הוצאות החודש"
                        value={`₪${(summary?.expense || 0).toLocaleString()}`}
                        icon={<TrendingDown sx={{ color: 'white' }} />}
                        color="#f44336"
                        onClick={() => navigate('/transactions?type=expense')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="יתרה"
                        value={`₪${balance.toLocaleString()}`}
                        icon={<AccountBalance sx={{ color: 'white' }} />}
                        color={balance >= 0 ? '#2196f3' : '#ff9800'}
                        onClick={() => navigate('/transactions')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="סך חסכונות"
                        value={`₪${totalSavings.toLocaleString()}`}
                        icon={<SavingsIcon sx={{ color: 'white' }} />}
                        color="#9c27b0"
                        onClick={() => navigate('/savings')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="התחייבויות"
                        value="צפה"
                        icon={<CommitmentsIcon sx={{ color: 'white' }} />}
                        color="#ff7043"
                        onClick={() => navigate('/commitments')}
                    />
                </Grid>
            </Grid>

            {/* Charts */}
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

                {/* Line Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 }}
                            onClick={() => navigate('/transactions')}
                        >
                            מגמה חודשית
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

