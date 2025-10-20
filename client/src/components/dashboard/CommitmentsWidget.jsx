import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';
import { Subscriptions, CalendarToday } from '@mui/icons-material';
import { commitmentService } from '../../services/commitmentService';

const CommitmentsWidget = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [commitmentsRes, upcomingRes] = await Promise.all([
                    commitmentService.getAll(),
                    commitmentService.getUpcomingCharges(7),
                ]);
                setData({
                    total: commitmentsRes.totals.totalMonthlyPayment,
                    count: commitmentsRes.totals.totalCommitments,
                    upcoming: upcomingRes.upcoming || [],
                });
            } catch (e) {
                setData({ total: 0, count: 0, upcoming: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !data) return null;

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Subscriptions color="primary" />
                    <Typography variant="h6">מנויים קבועים</Typography>
                </Box>

                <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">סה"כ חודשי</Typography>
                    <Typography variant="h4" color="primary">₪{data.total.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">{data.count} מנויים</Typography>
                </Box>

                {data.upcoming.length > 0 && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CalendarToday fontSize="small" color="warning" />
                        <Typography variant="body2">{data.upcoming.length} חיובים בימים הקרובים</Typography>
                        <Chip
                            label={`₪${data.upcoming.reduce((sum, c) => sum + (c.monthlyPayment || 0), 0).toLocaleString()}`}
                            size="small"
                            color="warning"
                        />
                    </Box>
                )}

                <Button fullWidth variant="outlined" onClick={() => navigate('/commitments')}>
                    לניהול מנויים
                </Button>
            </CardContent>
        </Card>
    );
};

export default CommitmentsWidget;


