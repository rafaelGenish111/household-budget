import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    Typography,
    Alert,
    Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { addDebtPayment } from '../../store/slices/debtsSlice';

const schema = yup.object({
    amount: yup.number().required('נא להזין סכום').positive('הסכום חייב להיות חיובי'),
    note: yup.string(),
    paymentMethod: yup.string().required('נא לבחור אמצעי תשלום'),
});

const paymentMethods = ['מזומן', 'העברה בנקאית', "צ'ק", 'אחר'];

const AddPaymentDialog = ({ open, onClose, debt }) => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { amount: 0, note: '', paymentMethod: 'מזומן' },
    });

    const watchAmount = watch('amount');

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await dispatch(addDebtPayment({ id: debt._id, paymentData: data }));
            onClose();
            reset();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!debt) return null;

    const isAmountValid = watchAmount > 0 && watchAmount <= debt.remainingAmount;
    const newRemaining = debt.remainingAmount - watchAmount;
    const newProgress = debt.originalAmount > 0
        ? Math.round(((debt.originalAmount - newRemaining) / debt.originalAmount) * 100)
        : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>הוסף תשלום - {debt.creditorName}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">סכום נותר כרגע</Typography>
                                <Typography variant="h5" color="error.main">₪{debt.remainingAmount.toLocaleString()}</Typography>
                                <Typography variant="caption" color="text.secondary">מתוך ₪{debt.originalAmount.toLocaleString()}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="amount" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" label="סכום התשלום" InputProps={{ startAdornment: '₪' }} error={!!errors.amount} helperText={errors.amount?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="paymentMethod" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth select label="אמצעי תשלום" error={!!errors.paymentMethod} helperText={errors.paymentMethod?.message}>
                                    {paymentMethods.map((m) => (<MenuItem key={m} value={m}>{m}</MenuItem>))}
                                </TextField>
                            )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="note" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth multiline rows={2} label="הערה (אופציונלי)" />
                            )} />
                        </Grid>
                        {watchAmount > 0 && isAmountValid && (
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    <Typography variant="body2" gutterBottom>אחרי התשלום:</Typography>
                                    <Typography variant="body2">• יתרת חוב: ₪{newRemaining.toLocaleString()}</Typography>
                                    <Typography variant="body2">• התקדמות: {newProgress}%</Typography>
                                    {newRemaining === 0 && (
                                        <Typography variant="body2" color="success.main" fontWeight="bold">✓ החוב ייסגר במלואו!</Typography>
                                    )}
                                </Alert>
                            </Grid>
                        )}
                        {watchAmount > debt.remainingAmount && (
                            <Grid item xs={12}><Alert severity="error">הסכום גדול מיתרת החוב (₪{debt.remainingAmount.toLocaleString()})</Alert></Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isSubmitting}>ביטול</Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting || !isAmountValid}>{isSubmitting ? 'מעבד...' : 'אשר תשלום'}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddPaymentDialog;


