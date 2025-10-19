import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    CircularProgress,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { createCommitment, updateCommitment } from '../../store/slices/commitmentsSlice';

const schema = yup.object({
    name: yup.string().required('נא להזין שם'),
    totalAmount: yup.number().required('נא להזין סכום כולל').positive('הסכום חייב להיות חיובי'),
    remaining: yup.number().required('נא להזין סכום נותר').min(0, 'הסכום חייב להיות לא שלילי'),
    monthlyPayment: yup.number().required('נא להזין תשלום חודשי').positive('התשלום חייב להיות חיובי'),
    paymentsLeft: yup.number().required('נא להזין מספר תשלומים').positive('המספר חייב להיות חיובי'),
    startDate: yup.date().required('נא לבחור תאריך'),
    // 🆕 שדות חדשים
    isRecurring: yup.boolean().default(true),
    recurringDay: yup.number().nullable().min(1, 'היום חייב להיות בין 1-31').max(31, 'היום חייב להיות בין 1-31'),
    recurringCategory: yup.string().default('החזרי הלוואות'),
});

const AddCommitmentDialog = ({ open, onClose, commitment }) => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: commitment?.name || '',
            totalAmount: commitment?.totalAmount || 0,
            remaining: commitment?.remaining || 0,
            monthlyPayment: commitment?.monthlyPayment || 0,
            paymentsLeft: commitment?.paymentsLeft || 0,
            startDate: commitment?.startDate ? 
                (commitment.startDate && !isNaN(new Date(commitment.startDate).getTime()) ? 
                    format(new Date(commitment.startDate), 'yyyy-MM-dd') : 
                    format(new Date(), 'yyyy-MM-dd')) : 
                format(new Date(), 'yyyy-MM-dd'),
            // 🆕 ערכי ברירת מחדל
            isRecurring: commitment?.isRecurring !== undefined ? commitment.isRecurring : true,
            recurringDay: commitment?.recurringDay || 1,
            recurringCategory: commitment?.recurringCategory || 'החזרי הלוואות',
        },
    });

    const watchIsRecurring = watch('isRecurring');

    useEffect(() => {
        if (open && commitment) {
            reset({
                name: commitment.name,
                totalAmount: commitment.totalAmount,
                remaining: commitment.remaining,
                monthlyPayment: commitment.monthlyPayment,
                paymentsLeft: commitment.paymentsLeft,
                startDate: commitment.startDate && !isNaN(new Date(commitment.startDate).getTime()) ? 
                    format(new Date(commitment.startDate), 'yyyy-MM-dd') : 
                    format(new Date(), 'yyyy-MM-dd'),
                isRecurring: commitment.isRecurring !== undefined ? commitment.isRecurring : true,
                recurringDay: commitment.recurringDay || 1,
                recurringCategory: commitment.recurringCategory || 'החזרי הלוואות',
            });
        } else if (open && !commitment) {
            reset({
                name: '',
                totalAmount: 0,
                remaining: 0,
                monthlyPayment: 0,
                paymentsLeft: 0,
                startDate: format(new Date(), 'yyyy-MM-dd'),
                isRecurring: true,
                recurringDay: 1,
                recurringCategory: 'החזרי הלוואות',
            });
        }
    }, [open, commitment, reset]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (commitment?._id) {
                await dispatch(updateCommitment({ id: commitment._id, data }));
            } else {
                await dispatch(createCommitment(data));
            }
            onClose();
            reset();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{commitment?._id ? 'עריכת התחייבות' : 'הוספת התחייבות חדשה'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="שם ההתחייבות"
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="totalAmount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="סכום מקורי"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.totalAmount}
                                        helperText={errors.totalAmount?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="remaining"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="נותר לתשלום"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.remaining}
                                        helperText={errors.remaining?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="monthlyPayment"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="תשלום חודשי"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.monthlyPayment}
                                        helperText={errors.monthlyPayment?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="paymentsLeft"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="תשלומים נותרים"
                                        error={!!errors.paymentsLeft}
                                        helperText={errors.paymentsLeft?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name="startDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="date"
                                        label="תאריך התחלה"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.startDate}
                                        helperText={errors.startDate?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* 🆕 תשלום חודשי אוטומטי */}
                        <Grid item xs={12}>
                            <Controller
                                name="isRecurring"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Checkbox 
                                                {...field} 
                                                checked={field.value !== false}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        }
                                        label="📝 תשלום חודשי אוטומטי"
                                    />
                                )}
                            />
                        </Grid>

                        {watchIsRecurring && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="recurringDay"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                type="number"
                                                label="יום בחודש לחיוב"
                                                helperText="בחר יום בין 1 ל-31"
                                                InputProps={{
                                                    inputProps: { min: 1, max: 31 }
                                                }}
                                                error={!!errors.recurringDay}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="recurringCategory"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="קטגוריה להוצאה"
                                                helperText="הקטגוריה שתופיע בהוצאות"
                                            />
                                        )}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>ביטול</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting && <CircularProgress size={20} />}
                    >
                        {commitment?._id ? 'עדכן' : 'הוסף'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddCommitmentDialog;

