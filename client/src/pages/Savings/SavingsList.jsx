import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    IconButton,
    Fab,
    Button,
} from '@mui/material';
import { Add, Edit, Delete, AddCircle } from '@mui/icons-material';
import { fetchSavings, deleteSaving } from '../../store/slices/savingsSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddSavingDialog from './AddSavingDialog';
import AddContributionDialog from './AddContributionDialog';

const SavingsList = () => {
    const dispatch = useDispatch();
    const { savings, isLoading } = useSelector((state) => state.savings);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editSaving, setEditSaving] = useState(null);
    const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
    const [selectedSaving, setSelectedSaving] = useState(null);

    useEffect(() => {
        dispatch(fetchSavings());
    }, [dispatch]);

    const handleDelete = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את החסכון?')) {
            await dispatch(deleteSaving(id));
        }
    };

    const handleEdit = (saving) => {
        setEditSaving(saving);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditSaving(null);
    };

    const handleContribute = (saving) => {
        setSelectedSaving(saving);
        setContributionDialogOpen(true);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        חסכונות
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        נהל את היעדים והחסכונות שלך
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setEditSaving(null);
                        setDialogOpen(true);
                    }}
                >
                    הוסף חסכון
                </Button>
            </Box>

            {savings.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            אין חסכונות עדיין
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            צור חסכון חדש כדי להתחיל לעקוב אחר היעדים שלך
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setDialogOpen(true)}
                        >
                            צור חסכון ראשון
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {savings.map((saving) => {
                        const progress = (saving.current / saving.goal) * 100;
                        const remaining = saving.goal - saving.current;

                        return (
                            <Grid item xs={12} sm={6} md={4} key={saving._id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                            <Typography variant="h6" fontWeight="bold">
                                                {saving.name}
                                            </Typography>
                                            <Box>
                                                <IconButton size="small" onClick={() => handleEdit(saving)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(saving._id)}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Box mb={2}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    התקדמות
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold" color="primary">
                                                    {progress.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(progress, 100)}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 5,
                                                    bgcolor: 'grey.200',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
                                                    },
                                                }}
                                            />
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    נוכחי
                                                </Typography>
                                                <Typography variant="h6" color="success.main">
                                                    ₪{saving.current.toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    יעד
                                                </Typography>
                                                <Typography variant="h6">
                                                    ₪{saving.goal.toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            {remaining > 0 && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        נותר לחסוך: ₪{remaining.toLocaleString()}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {saving.monthlyContribution > 0 && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" color="primary">
                                                        תרומה חודשית: ₪{saving.monthlyContribution.toLocaleString()}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            {saving.targetDate && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        תאריך יעד:{' '}
                                                        {new Date(saving.targetDate).toLocaleDateString('he-IL')}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<AddCircle />}
                                            onClick={() => handleContribute(saving)}
                                            sx={{ mt: 2 }}
                                        >
                                            הוסף תרומה
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <AddSavingDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                saving={editSaving}
            />

            <AddContributionDialog
                open={contributionDialogOpen}
                onClose={() => setContributionDialogOpen(false)}
                saving={selectedSaving}
            />
        </Box>
    );
};

export default SavingsList;

