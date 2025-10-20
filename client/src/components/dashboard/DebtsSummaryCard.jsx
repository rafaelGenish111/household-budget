import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, Typography, Box, Button, Alert, Chip, CircularProgress } from '@mui/material';
import { TrendingUp, TrendingDown, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchDebtsSummary, fetchUpcomingDebts } from '../../store/slices/debtsSlice';

const DebtsSummaryCard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { summary, upcomingDebts, isLoading } = useSelector((state) => state.debts);

    useEffect(() => {
        dispatch(fetchDebtsSummary());
        dispatch(fetchUpcomingDebts(7));
    }, [dispatch]);

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (!summary) return null;

    const hasDebts = summary.totalOwe > 0 || summary.totalOwed > 0;
    const netDebt = summary.netDebt;
    const hasUpcoming = upcomingDebts && upcomingDebts.length > 0;

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">חובות והלוואות</Typography>
                    {hasDebts && (
                        <Chip label={`${summary.countOwe + summary.countOwed} פעילים`} size="small" color="primary" />
                    )}
                </Box>

                {!hasDebts ? (
                    <Box textAlign="center" py={3}>
                        <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">אין חובות פעילים</Typography>
                        <Typography variant="caption" color="text.secondary">מצוין! אין לך חובות עומדים כרגע</Typography>
                    </Box>
                ) : (
                    <>
                        {hasUpcoming && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight="bold">⚠️ {upcomingDebts.length} חובות מתקרבים לתאריך יעד</Typography>
                            </Alert>
                        )}

                        <Box display="flex" flexDirection="column" gap={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ backgroundColor: 'error.light', borderRadius: 1, opacity: 0.15 }}>
                                <Box display="flex" alignItems="center" gap={1}><TrendingDown color="error" /><Typography variant="body2">אני חייב</Typography></Box>
                                <Typography variant="h6" color="error.main">₪{summary.totalOwe.toLocaleString()}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ backgroundColor: 'success.light', borderRadius: 1, opacity: 0.15 }}>
                                <Box display="flex" alignItems="center" gap={1}><TrendingUp color="success" /><Typography variant="body2">חייבים לי</Typography></Box>
                                <Typography variant="h6" color="success.main">₪{summary.totalOwed.toLocaleString()}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ backgroundColor: 'grey.100', borderRadius: 1, border: 2, borderColor: netDebt > 0 ? 'error.main' : 'success.main' }}>
                                <Typography variant="body2" fontWeight="bold">נטו חובות</Typography>
                                <Typography variant="h6" fontWeight="bold" color={netDebt > 0 ? 'error.main' : netDebt < 0 ? 'success.main' : 'text.primary'}>
                                    {netDebt > 0 ? '-' : netDebt < 0 ? '+' : ''}₪{Math.abs(netDebt).toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>

                        <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/commitments?tab=1')}>
                            לניהול חובות
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default DebtsSummaryCard;


