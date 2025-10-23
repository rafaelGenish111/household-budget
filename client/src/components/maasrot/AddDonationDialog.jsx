import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { addDonation, updateDonation } from '../../store/slices/maasrotSlice';

const schema = yup.object({
    amount: yup
        .number()
        .required('נא להזין סכום התרומה')
        .positive('סכום התרומה חייב להיות חיובי')
        .min(1, 'סכום התרומה חייב להיות לפחות ₪1'),
    date: yup
        .date()
        .required('נא לבחור תאריך התרומה')
        .max(new Date(), 'תאריך התרומה לא יכול להיות בעתיד'),
    description: yup
        .string()
        .max(200, 'התיאור לא יכול להיות ארוך מ-200 תווים'),
});

const AddDonationDialog = ({ open, onClose, donation }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.maasrot);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            amount: donation?.amount || 0,
            date: donation?.date 
                ? format(new Date(donation.date), 'yyyy-MM-dd')
                : format(new Date(), 'yyyy-MM-dd'),
            description: donation?.description || '',
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                amount: donation?.amount || 0,
                date: donation?.date 
                    ? format(new Date(donation.date), 'yyyy-MM-dd')
                    : format(new Date(), 'yyyy-MM-dd'),
                description: donation?.description || '',
            });
        }
    }, [open, donation, reset]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (donation) {
                // Update existing donation
                await dispatch(updateDonation({
                    donationId: donation._id,
                    donationData: {
                        amount: Number(data.amount),
                        date: data.date,
                        description: data.description,
                    }
                }));
            } else {
                // Add new donation
                await dispatch(addDonation({
                    amount: Number(data.amount),
                    date: data.date,
                    description: data.description,
                }));
            }
            onClose();
        } catch (error) {
            console.error('Error saving donation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {donation ? 'עריכת תרומה' : 'הוספת תרומה חדשה'}
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Grid container spacing={2}>
                        {/* Amount */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="סכום התרומה"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.amount}
                                        helperText={errors.amount?.message}
                                        inputProps={{ min: 1, step: 0.01 }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Date */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="date"
                                        label="תאריך התרומה"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.date}
                                        helperText={errors.date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="תיאור (אופציונלי)"
                                        placeholder="למי התרמת? איך השתמשת בכסף? וכו'"
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

                    {/* Info Box */}
                    <Box
                        sx={{
                            mt: 3,
                            p: 2,
                            backgroundColor: 'info.light',
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'info.main',
                        }}
                    >
                        <Typography variant="body2" color="info.contrastText">
                            💡 <strong>טיפ:</strong> המעשרות הן 10% מההכנסה החודשית שלך. 
                            תוכל לעקוב אחר ההתקדמות שלך בסיכום למעלה.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        ביטול
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting && <CircularProgress size={20} />}
                    >
                        {donation ? 'עדכן' : 'הוסף'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddDonationDialog;
