import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    LinearProgress,
    IconButton,
    Button,
} from '@mui/material';
import { Add, ExpandMore, Edit, Delete, Payment } from '@mui/icons-material';
import { fetchCommitments, deleteCommitment } from '../../store/slices/commitmentsSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddCommitmentDialog from './AddCommitmentDialog';
import RecordPaymentDialog from './RecordPaymentDialog';

const CommitmentsList = () => {
    const dispatch = useDispatch();
    const { commitments, totals, isLoading } = useSelector((state) => state.commitments);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editCommitment, setEditCommitment] = useState(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedCommitment, setSelectedCommitment] = useState(null);

    useEffect(() => {
        dispatch(fetchCommitments());
    }, [dispatch]);

    const handleDelete = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את ההתחייבות?')) {
            await dispatch(deleteCommitment(id));
        }
    };

    const handleEdit = (commitment) => {
        setEditCommitment(commitment);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditCommitment(null);
    };

    const handleRecordPayment = (commitment) => {
        setSelectedCommitment(commitment);
        setPaymentDialogOpen(true);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        התחייבויות
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        עקוב אחר ההלוואות והחובות שלך
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setEditCommitment(null);
                        setDialogOpen(true);
                    }}
                >
                    הוסף התחייבות
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} mb={4}>
                <Grid item xs={12} sm={4}>
                    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography color="text.secondary" gutterBottom>
                                סך חוב
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                                ₪{totals.totalDebt.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography color="text.secondary" gutterBottom>
                                תשלום חודשי
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                                ₪{totals.totalMonthlyPayment.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography color="text.secondary" gutterBottom>
                                מספר הלוואות
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary.main">
                                {totals.totalCommitments}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Commitments List */}
            {commitments.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            אין התחייבויות
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            צור התחייבות חדשה כדי לעקוב אחר ההלוואות שלך
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setDialogOpen(true)}
                        >
                            צור התחייבות ראשונה
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Box>
                    {commitments.map((commitment) => {
                        const paid = commitment.totalAmount - commitment.remaining;
                        const progress = (paid / commitment.totalAmount) * 100;

                        return (
                            <Accordion key={commitment._id}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        width="100%"
                                        mr={2}
                                    >
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {commitment.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                תשלום חודשי: ₪{commitment.monthlyPayment.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" color="error.main">
                                            ₪{commitment.remaining.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <Box mb={2}>
                                                <Box display="flex" justifyContent="space-between" mb={1}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        התקדמות בפירעון
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                                        {progress.toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={progress}
                                                    sx={{
                                                        height: 10,
                                                        borderRadius: 5,
                                                        bgcolor: 'grey.200',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: 'success.main',
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                סכום מקורי
                                            </Typography>
                                            <Typography variant="h6">
                                                ₪{commitment.totalAmount.toLocaleString()}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                שולם עד כה
                                            </Typography>
                                            <Typography variant="h6" color="success.main">
                                                ₪{paid.toLocaleString()}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                נותר לתשלום
                                            </Typography>
                                            <Typography variant="h6" color="error.main">
                                                ₪{commitment.remaining.toLocaleString()}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                תשלומים נותרים
                                            </Typography>
                                            <Typography variant="h6">
                                                {commitment.paymentsLeft}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                תאריך התחלה
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(commitment.startDate).toLocaleDateString('he-IL')}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Box display="flex" gap={1}>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<Payment />}
                                                    onClick={() => handleRecordPayment(commitment)}
                                                >
                                                    רשום תשלום
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Edit />}
                                                    onClick={() => handleEdit(commitment)}
                                                >
                                                    ערוך
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<Delete />}
                                                    onClick={() => handleDelete(commitment._id)}
                                                >
                                                    מחק
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            )}

            <AddCommitmentDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                commitment={editCommitment}
            />

            <RecordPaymentDialog
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                commitment={selectedCommitment}
            />
        </Box>
    );
};

export default CommitmentsList;

