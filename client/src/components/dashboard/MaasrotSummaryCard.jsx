import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    AccountBalance,
    TrendingUp,
    AttachMoney,
    CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchMaasrot } from '../../store/slices/maasrotSlice';

const MaasrotSummaryCard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { maasrot, isLoading, error } = useSelector((state) => state.maasrot);

    useEffect(() => {
        dispatch(fetchMaasrot());
    }, [dispatch]);

    const getProgressColor = (remaining) => {
        if (remaining <= 0) return 'success.main';
        if (remaining <= maasrot.maasrotTarget * 0.3) return 'warning.main';
        return 'error.main';
    };

    const getProgressPercentage = () => {
        if (maasrot.maasrotTarget === 0) return 0;
        return Math.round((maasrot.totalDonated / maasrot.maasrotTarget) * 100);
    };

    if (isLoading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        שגיאה בטעינת נתוני המעשרות
                    </Alert>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/maasrot')}
                    >
                        ניהול מעשרות
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                        מעשרות
                    </Typography>
                    <Chip
                        label={`${getProgressPercentage()}%`}
                        color={getProgressPercentage() >= 100 ? 'success' : 'primary'}
                        size="small"
                    />
                </Box>

                {/* Summary */}
                <Box mb={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AccountBalance color="success" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                            יעד: ₪{maasrot.maasrotTarget.toLocaleString()}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AttachMoney color="info" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                            תרומות: ₪{maasrot.totalDonated.toLocaleString()}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday
                            color={maasrot.remaining <= 0 ? 'success' : 'warning'}
                            fontSize="small"
                        />
                        <Typography
                            variant="body2"
                            color={getProgressColor(maasrot.remaining)}
                            fontWeight="bold"
                        >
                            יתרה: ₪{maasrot.remaining.toLocaleString()}
                        </Typography>
                    </Box>
                </Box>

                {/* Progress Bar */}
                <Box mb={3}>
                    <Box
                        sx={{
                            width: '100%',
                            height: 6,
                            backgroundColor: 'grey.200',
                            borderRadius: 3,
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                width: `${Math.min(getProgressPercentage(), 100)}%`,
                                height: '100%',
                                backgroundColor: getProgressColor(maasrot.remaining),
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </Box>
                </Box>

                {/* Status Message */}
                {maasrot.remaining <= 0 ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        🎉 סיימת את המעשרות החודשיות!
                    </Alert>
                ) : maasrot.remaining <= maasrot.maasrotTarget * 0.3 ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        ⚠️ נותרו {Math.round(maasrot.remaining)}₪ למעשרות
                    </Alert>
                ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        💡 התחל עם המעשרות החודשיות שלך
                    </Alert>
                )}

                {/* Action Button */}
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/maasrot')}
                    sx={{ mt: 'auto' }}
                >
                    ניהול מעשרות
                </Button>
            </CardContent>
        </Card>
    );
};

export default MaasrotSummaryCard;
