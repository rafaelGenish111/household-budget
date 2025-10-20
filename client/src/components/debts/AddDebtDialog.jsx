import { useEffect, useState } from 'react';
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
    Chip,
    Box,
    Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { createDebt, updateDebt } from '../../store/slices/debtsSlice';

const schema = yup.object({
    type: yup.string().required('נא לבחור סוג חוב'),
    creditorName: yup.string().required('נא להזין שם'),
    originalAmount: yup.number().required('נא להזין סכום').positive('הסכום חייב להיות חיובי'),
    remainingAmount: yup.number().required('נא להזין סכום נותר').positive('הסכום חייב להיות חיובי'),
    description: yup.string(),
    dueDate: yup.date().nullable(),
    startDate: yup.date(),
    interestRate: yup.number().min(0).max(100),
    category: yup.string(),
    priority: yup.string(),
});

const categories = [
    { value: 'personal', label: 'אישי' },
    { value: 'family', label: 'משפחה' },
    { value: 'bank', label: 'בנק' },
    { value: 'business', label: 'עסקי' },
    { value: 'other', label: 'אחר' },
];

const priorities = [
    { value: 'low', label: 'נמוך', color: 'success' },
    { value: 'medium', label: 'בינוני', color: 'info' },
    { value: 'high', label: 'גבוה', color: 'warning' },
    { value: 'urgent', label: 'דחוף', color: 'error' },
];

const AddDebtDialog = ({ open, onClose, debt }) => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            type: 'owe',
            creditorName: '',
            originalAmount: 0,
            remainingAmount: 0,
            description: '',
            dueDate: '',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            interestRate: 0,
            category: 'personal',
            priority: 'medium',
        },
    });

    const watchOriginal = watch('originalAmount');
    const watchRemaining = watch('remainingAmount');
    const watchType = watch('type');

    useEffect(() => {
        if (debt) {
            reset({
                type: debt.type,
                creditorName: debt.creditorName,
                originalAmount: debt.originalAmount,
                remainingAmount: debt.remainingAmount,
                description: debt.description || '',
                dueDate: debt.dueDate ? format(new Date(debt.dueDate), 'yyyy-MM-dd') : '',
                startDate: format(new Date(debt.startDate || new Date()), 'yyyy-MM-dd'),
                interestRate: debt.interestRate || 0,
                category: debt.category || 'personal',
                priority: debt.priority || 'medium',
            });
        }
    }, [debt, reset, open]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (debt?._id) await dispatch(updateDebt({ id: debt._id, data }));
            else await dispatch(createDebt(data));
            onClose();
            reset();
        } finally {
            setIsSubmitting(false);
        }
    };

    const paidPct = watchOriginal > 0 ? Math.round(((watchOriginal - watchRemaining) / watchOriginal) * 100) : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{debt?._id ? 'עריכת חוב' : 'הוספת חוב חדש'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller name="type" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth select label="סוג" error={!!errors.type} helperText={errors.type?.message}>
                                    <MenuItem value="owe">אני חייב</MenuItem>
                                    <MenuItem value="owed">חייבים לי</MenuItem>
                                </TextField>
                            )} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller name="creditorName" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth label={watchType === 'owe' ? 'שם הנושה' : 'שם החייב'} error={!!errors.creditorName} helperText={errors.creditorName?.message} />
                            )} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller name="category" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth select label="קטגוריה">
                                    {categories.map((cat) => (<MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>))}
                                </TextField>
                            )} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller name="originalAmount" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" label="סכום מקורי" InputProps={{ startAdornment: '₪' }} error={!!errors.originalAmount} helperText={errors.originalAmount?.message} />
                            )} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller name="remainingAmount" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" label="סכום נותר" InputProps={{ startAdornment: '₪' }} error={!!errors.remainingAmount} helperText={errors.remainingAmount?.message} />
                            )} />
                        </Grid>

                        {watchOriginal > 0 && (
                            <Grid item xs={12}>
                                <Box>
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">התקדמות תשלום</Typography>
                                        <Typography variant="body2" fontWeight="bold">{paidPct}%</Typography>
                                    </Box>
                                    <Box sx={{ width: '100%', height: 10, backgroundColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
                                        <Box sx={{ width: `${paidPct}%`, height: '100%', backgroundColor: 'success.main', transition: 'width 0.3s' }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">שולם: ₪{(watchOriginal - watchRemaining).toLocaleString()}</Typography>
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6}>
                            <Controller name="startDate" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="date" label="תאריך התחלה" InputLabelProps={{ shrink: true }} error={!!errors.startDate} helperText={errors.startDate?.message} />
                            )} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller name="dueDate" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="date" label="תאריך יעד (אופציונלי)" InputLabelProps={{ shrink: true }} error={!!errors.dueDate} helperText={errors.dueDate?.message} />
                            )} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller name="interestRate" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" label="ריבית שנתית (%)" InputProps={{ endAdornment: '%' }} error={!!errors.interestRate} helperText={errors.interestRate?.message} />
                            )} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller name="priority" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth select label="עדיפות">
                                    {priorities.map((p) => (
                                        <MenuItem key={p.value} value={p.value}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Chip label={p.label} color={p.color} size="small" />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )} />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller name="description" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth multiline rows={3} label="תיאור (אופציונלי)" error={!!errors.description} helperText={errors.description?.message} />
                            )} />
                        </Grid>

                        {watchRemaining > watchOriginal && (
                            <Grid item xs={12}><Alert severity="warning">הסכום הנותר גדול מהסכום המקורי. וודא שהסכומים נכונים.</Alert></Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isSubmitting}>ביטול</Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'שומר...' : 'שמור'}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddDebtDialog;


