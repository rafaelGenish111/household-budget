import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Grid, Card, CardContent, Button, Container, Paper } from '@mui/material';
import { Add } from '@mui/icons-material';
import { fetchCommitments, deleteCommitment } from '../../store/slices/commitmentsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddCommitmentDialog from '../../components/commitments/AddCommitmentDialog';
import CommitmentCard from '../../components/commitments/CommitmentCard';

const CommitmentsList = () => {
    const dispatch = useDispatch();
    const { commitments, totals, isLoading } = useSelector((state) => state.commitments);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editCommitment, setEditCommitment] = useState(null);
    const [selectedCommitment, setSelectedCommitment] = useState(null);

    useEffect(() => {
        dispatch(fetchCommitments());
        dispatch(fetchCategories());
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

    const handleRecordPayment = () => { };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 3, backgroundColor: 'background.default' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">מנויים קבועים</Typography>
                        <Typography variant="body2" color="text.secondary">
                            עקוב אחר המנויים והחיובים הקבועים שלך
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
                        הוסף מנוי
                    </Button>
                </Box>

                {/* Summary Card */}
                <Grid container spacing={2} mb={4}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                                <Typography color="text.secondary" gutterBottom>
                                    סה"כ הוצאות חודשיות קבועות
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color="primary.main">
                                    ₪{totals.totalMonthlyPayment.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {totals.totalCommitments} מנויים
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Commitments List */}
                {commitments.length === 0 ? (
                    <Box textAlign="center" py={8} sx={{ backgroundColor: 'grey.50', borderRadius: 2, border: '2px dashed', borderColor: 'grey.300' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>אין מנויים</Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>צור מנוי חדש כדי להתחיל לעקוב אחר החיובים הקבועים שלך</Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>צור מנוי ראשון</Button>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {commitments.map((commitment) => (
                            <Grid item xs={12} md={6} lg={4} key={commitment._id}>
                                <CommitmentCard
                                    commitment={commitment}
                                    onEdit={(c) => handleEdit(c)}
                                    onDelete={(c) => handleDelete(c._id)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}

                <AddCommitmentDialog
                    open={dialogOpen}
                    onClose={handleDialogClose}
                    commitment={editCommitment}
                />

                {/* הוסר דיאלוג תשלום – מודל חדש של מנויים */}
            </Paper>
        </Container>
    );
};

export default CommitmentsList;

