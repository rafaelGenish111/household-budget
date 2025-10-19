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
import { createSaving, updateSaving } from '../../store/slices/savingsSlice';

const schema = yup.object({
    name: yup.string().required('נא להזין שם'),
    goal: yup.number().required('נא להזין יעד').positive('היעד חייב להיות חיובי'),
    current: yup.number().required('נא להזין סכום נוכחי').min(0, 'הסכום חייב להיות לא שלילי'),
    monthlyContribution: yup.number().min(0, 'התרומה חייבת להיות לא שלילית'),
    targetDate: yup.date().nullable(),
    // 🆕 שדות חדשים לתשלומים חוזרים
    isRecurring: yup.boolean().default(false),
    recurringDay: yup.number().nullable().min(1, 'היום חייב להיות בין 1-31').max(31, 'היום חייב להיות בין 1-31'),
    recurringCategory: yup.string().default('חסכונות'),
});

const AddSavingDialog = ({ open, onClose, saving }) => {
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
            name: saving?.name || '',
            goal: saving?.goal || 0,
            current: saving?.current || 0,
            monthlyContribution: saving?.monthlyContribution || 0,
            targetDate: saving?.targetDate && !isNaN(new Date(saving.targetDate).getTime()) ? 
                format(new Date(saving.targetDate), 'yyyy-MM-dd') : '',
            // 🆕 ערכי ברירת מחדל לשדות חדשים
            isRecurring: saving?.isRecurring || false,
            recurringDay: saving?.recurringDay || 1,
            recurringCategory: saving?.recurringCategory || 'חסכונות',
        },
    });

    // 🆕 מעקב אחרי השדה isRecurring
    const watchIsRecurring = watch('isRecurring');

    useEffect(() => {
        if (open && saving) {
            reset({
                name: saving.name,
                goal: saving.goal,
                current: saving.current,
                monthlyContribution: saving.monthlyContribution || 0,
                targetDate: saving.targetDate && !isNaN(new Date(saving.targetDate).getTime()) ? 
                    format(new Date(saving.targetDate), 'yyyy-MM-dd') : '',
                isRecurring: saving.isRecurring || false,
                recurringDay: saving.recurringDay || 1,
                recurringCategory: saving.recurringCategory || 'חסכונות',
            });
        } else if (open && !saving) {
            reset({
                name: '',
                goal: 0,
                current: 0,
                monthlyContribution: 0,
                targetDate: '',
                isRecurring: false,
                recurringDay: 1,
                recurringCategory: 'חסכונות',
            });
        }
    }, [open, saving, reset]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const savingData = {
                ...data,
                targetDate: data.targetDate || null,
            };

            if (saving?._id) {
                await dispatch(updateSaving({ id: saving._id, data: savingData }));
            } else {
                await dispatch(createSaving(savingData));
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
            <DialogTitle>{saving?._id ? 'עריכת חסכון' : 'הוספת חסכון חדש'}</DialogTitle>
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
                                        label="שם החסכון"
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="goal"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="יעד"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.goal}
                                        helperText={errors.goal?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="current"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="סכום נוכחי"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.current}
                                        helperText={errors.current?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="monthlyContribution"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="תרומה חודשית"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.monthlyContribution}
                                        helperText={errors.monthlyContribution?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="targetDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="date"
                                        label="תאריך יעד (אופציונלי)"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.targetDate}
                                        helperText={errors.targetDate?.message}
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
                                                checked={field.value || false}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        }
                                        label="💰 הפקדה חודשית אוטומטית"
                                    />
                                )}
                            />
                        </Grid>

                        {/* 🆕 יום בחודש - מופיע רק אם isRecurring מסומן */}
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
                        {saving?._id ? 'עדכן' : 'הוסף'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddSavingDialog;

