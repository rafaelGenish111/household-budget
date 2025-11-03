import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Alert,
    CircularProgress,
    Paper,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
} from '@mui/material';
import {
    Add,
    TrendingUp,
    AccountBalance,
    MoreVert,
    Edit,
    Delete,
    AttachMoney,
    CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { fetchMaasrot, addDonation, updateDonation, deleteDonation } from '../../store/slices/maasrotSlice';
import AddDonationDialog from '../../components/maasrot/AddDonationDialog';
import MonthSelector from '../../components/common/MonthSelector';

const Maasrot = () => {
    const dispatch = useDispatch();
    const { maasrot, isLoading, error } = useSelector((state) => state.maasrot);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedDonationId, setSelectedDonationId] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    useEffect(() => {
        const month = selectedMonth.getMonth() + 1; // 1-12
        const year = selectedMonth.getFullYear();
        dispatch(fetchMaasrot({ month, year }));
    }, [dispatch, selectedMonth]);

    const handleAddDonation = () => {
        setSelectedDonation(null);
        setDialogOpen(true);
    };

    const handleEditDonation = (donation) => {
        setSelectedDonation(donation);
        setDialogOpen(true);
    };

    const handleDeleteDonation = async (donationId) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את התרומה?')) {
            await dispatch(deleteDonation(donationId));
            // Refresh maasrot data after deletion
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            dispatch(fetchMaasrot({ month, year }));
        }
    };

    const handleMenuOpen = (event, donationId) => {
        setAnchorEl(event.currentTarget);
        setSelectedDonationId(donationId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedDonationId(null);
    };

    const getProgressColor = (remaining) => {
        if (remaining <= 0) return 'success.main';
        if (remaining <= (maasrot?.maasrotTarget || 0) * 0.3) return 'warning.main';
        return 'error.main';
    };

    const getProgressPercentage = () => {
        if (!maasrot?.maasrotTarget || maasrot.maasrotTarget === 0) return 0;
        return Math.round((maasrot.totalDonated / maasrot.maasrotTarget) * 100);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 3, backgroundColor: 'background.default' }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            ניהול מעשרות
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            עקוב אחר המעשרות שלך (10% מההכנסה החודשית)
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        size="large"
                        onClick={handleAddDonation}
                    >
                        הוסף תרומה
                    </Button>
                </Box>

                {/* Month Selector */}
                <Paper sx={{ p: 2, mb: 4 }}>
                    <MonthSelector
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        label="בחר חודש"
                    />
                </Paper>

                {/* Summary Cards */}
                <Grid container spacing={3} mb={4}>
                    {/* Monthly Income */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <TrendingUp color="primary" />
                                    <Typography variant="body2" color="text.secondary">
                                        הכנסה חודשית
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="primary.main">
                                    ₪{(maasrot?.monthlyIncome || 0).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Maasrot Target */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <AccountBalance color="success" />
                                    <Typography variant="body2" color="text.secondary">
                                        יעד מעשרות (10%)
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="success.main">
                                    ₪{(maasrot?.maasrotTarget || 0).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Total Donated */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <AttachMoney color="info" />
                                    <Typography variant="body2" color="text.secondary">
                                        סך תרומות
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="info.main">
                                    ₪{(maasrot?.totalDonated || 0).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Remaining */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <CalendarToday color={(maasrot?.remaining || 0) <= 0 ? 'success' : 'warning'} />
                                    <Typography variant="body2" color="text.secondary">
                                        יתרה נותרת
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="h4"
                                    fontWeight="bold"
                                    color={getProgressColor(maasrot?.remaining || 0)}
                                >
                                    ₪{(maasrot?.remaining || 0).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Progress Bar */}
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight="bold">
                                התקדמות במעשרות
                            </Typography>
                            <Chip
                                label={`${getProgressPercentage()}%`}
                                color={getProgressPercentage() >= 100 ? 'success' : 'primary'}
                                size="small"
                            />
                        </Box>
                        <Box
                            sx={{
                                width: '100%',
                                height: 8,
                                backgroundColor: 'grey.200',
                                borderRadius: 4,
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    width: `${Math.min(getProgressPercentage(), 100)}%`,
                                    height: '100%',
                                    backgroundColor: getProgressColor(maasrot?.remaining || 0),
                                    transition: 'width 0.3s ease',
                                }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary" mt={1} display="block">
                            {(maasrot?.totalDonated || 0).toLocaleString()} מתוך {(maasrot?.maasrotTarget || 0).toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Donations List */}
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent sx={{ p: 0 }}>
                        <Box sx={{ p: 3, pb: 0 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                היסטוריית תרומות
                            </Typography>
                        </Box>

                        {maasrot?.donations?.length === 0 ? (
                            <Box textAlign="center" py={8} sx={{ px: 3 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    אין תרומות
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    התחל להוסיף תרומות כדי לעקוב אחר המעשרות שלך
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handleAddDonation}
                                >
                                    הוסף תרומה ראשונה
                                </Button>
                            </Box>
                        ) : (
                            <List>
                                {(maasrot?.donations || []).map((donation, index) => (
                                    <div key={donation._id || index}>
                                        <ListItem sx={{ py: 2 }}>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="h6" fontWeight="bold">
                                                            ₪{donation.amount.toLocaleString()}
                                                        </Typography>
                                                        <Chip
                                                            label={format(new Date(donation.date), 'dd/MM/yyyy', { locale: he })}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    donation.description && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {donation.description}
                                                        </Typography>
                                                    )
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, donation._id)}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < (maasrot?.donations?.length || 0) - 1 && <Divider />}
                                    </div>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>

                {/* Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem
                        onClick={() => {
                            const donation = (maasrot?.donations || []).find(d => d._id === selectedDonationId);
                            if (donation) {
                                handleEditDonation(donation);
                            }
                            handleMenuClose();
                        }}
                    >
                        <Edit fontSize="small" sx={{ mr: 1 }} />
                        ערוך
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            handleDeleteDonation(selectedDonationId);
                            handleMenuClose();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <Delete fontSize="small" sx={{ mr: 1 }} />
                        מחק
                    </MenuItem>
                </Menu>
            </Paper>

            {/* Add/Edit Donation Dialog */}
            <AddDonationDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setSelectedDonation(null);
                    // Refresh maasrot data after dialog closes
                    const month = selectedMonth.getMonth() + 1;
                    const year = selectedMonth.getFullYear();
                    dispatch(fetchMaasrot({ month, year }));
                }}
                donation={selectedDonation}
            />
        </Container>
    );
};

export default Maasrot;
