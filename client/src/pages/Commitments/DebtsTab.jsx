import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Grid, Button, Tabs, Tab, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { Add, TrendingUp, TrendingDown } from '@mui/icons-material';
import { fetchDebts, deleteDebt } from '../../store/slices/debtsSlice';
import AddPaymentDialog from '../../components/debts/AddPaymentDialog';
import AddDebtDialog from '../../components/debts/AddDebtDialog';
import DebtCard from '../../components/debts/DebtCard';
import DebtDetailsDialog from '../../components/debts/DebtDetailsDialog';

const DebtsTab = () => {
    const dispatch = useDispatch();
    const { debts, isLoading } = useSelector((state) => state.debts);
    const [debtType, setDebtType] = useState('all');
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => { dispatch(fetchDebts()); }, [dispatch]);

    const handleDelete = async (debt) => {
        if (window.confirm(`האם למחוק את החוב "${debt.creditorName}"?`)) {
            await dispatch(deleteDebt(debt._id));
        }
    };

    const handleAddPayment = (debt) => {
        setSelectedDebt(debt);
        setPaymentDialogOpen(true);
    };

    const filteredDebts = debts.filter((d) => (debtType === 'all' ? true : d.type === debtType));
    const activeDebts = filteredDebts.filter((d) => d.status !== 'paid');
    const paidDebts = filteredDebts.filter((d) => d.status === 'paid');

    const summary = debts.reduce((acc, d) => {
        if (d.status === 'paid') return acc;
        if (d.type === 'owe') { acc.totalOwe += d.remainingAmount; acc.countOwe += 1; }
        else { acc.totalOwed += d.remainingAmount; acc.countOwed += 1; }
        return acc;
    }, { totalOwe: 0, countOwe: 0, totalOwed: 0, countOwed: 0 });

    const netDebt = summary.totalOwe - summary.totalOwed;

    if (isLoading) {
        return (<Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>);
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">חובות והלוואות</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setSelectedDebt(null);
                        setDialogOpen(true);
                    }}
                >
                    הוסף חוב
                </Button>
            </Box>

            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}><CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}><TrendingDown color="error" /><Typography variant="body2" color="text.secondary">אני חייב</Typography></Box>
                        <Typography variant="h5" color="error.main">₪{summary.totalOwe.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary">{summary.countOwe} חובות</Typography>
                    </CardContent></Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}><CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}><TrendingUp color="success" /><Typography variant="body2" color="text.secondary">חייבים לי</Typography></Box>
                        <Typography variant="h5" color="success.main">₪{summary.totalOwed.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary">{summary.countOwed} חובות</Typography>
                    </CardContent></Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}><CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" mb={1}>נטו חובות</Typography>
                        <Typography variant="h5" color={netDebt > 0 ? 'error.main' : netDebt < 0 ? 'success.main' : 'text.primary'}>
                            {netDebt > 0 ? '-' : netDebt < 0 ? '+' : ''}₪{Math.abs(netDebt).toLocaleString()}
                        </Typography>
                    </CardContent></Card>
                </Grid>
            </Grid>

            <Tabs value={debtType} onChange={(e, v) => setDebtType(v)} sx={{ mb: 3 }}>
                <Tab label={`הכל (${debts.length})`} value="all" />
                <Tab label={`אני חייב (${summary.countOwe})`} value="owe" />
                <Tab label={`חייבים לי (${summary.countOwed})`} value="owed" />
            </Tabs>

            {activeDebts.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>{debtType === 'all' ? 'אין חובות פעילים.' : 'אין חובות פעילים בקטגוריה זו.'}</Alert>
            ) : (
                <>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ px: 0.5 }}>חובות פעילים ({activeDebts.length})</Typography>
                    <Grid container spacing={2} mb={4}>
                        {activeDebts.map((debt) => (
                            <Grid item xs={12} md={6} lg={4} key={debt._id}>
                                <DebtCard
                                    debt={debt}
                                    onAddPayment={handleAddPayment}
                                    onDelete={handleDelete}
                                    onEdit={(d) => { setSelectedDebt(d); setDialogOpen(true); }}
                                    onOpenDetails={(d) => { setSelectedDebt(d); setDetailsOpen(true); }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {paidDebts.length > 0 && (
                <>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ px: 0.5 }}>חובות ששולמו ({paidDebts.length})</Typography>
                    <Grid container spacing={2}>
                        {paidDebts.map((debt) => (
                            <Grid item xs={12} md={6} lg={4} key={debt._id}>
                                <DebtCard
                                    debt={debt}
                                    onOpenDetails={(d) => { setSelectedDebt(d); setDetailsOpen(true); }}
                                    onDelete={handleDelete}
                                    onEdit={(d) => { setSelectedDebt(d); setDialogOpen(true); }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            <AddPaymentDialog open={paymentDialogOpen} onClose={() => { setPaymentDialogOpen(false); setSelectedDebt(null); }} debt={selectedDebt} />
            <AddDebtDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedDebt(null); }} debt={selectedDebt} />
            <DebtDetailsDialog open={detailsOpen} onClose={() => { setDetailsOpen(false); setSelectedDebt(null); }} debt={selectedDebt} />
        </Box>
    );
};

export default DebtsTab;


