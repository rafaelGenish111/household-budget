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
});

const AddSavingDialog = ({ open, onClose, saving }) => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
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
        },
    });

    useEffect(() => {
        if (open && saving) {
            reset({
                name: saving.name,
                goal: saving.goal,
                current: saving.current,
                monthlyContribution: saving.monthlyContribution || 0,
                targetDate: saving.targetDate && !isNaN(new Date(saving.targetDate).getTime()) ? 
                    format(new Date(saving.targetDate), 'yyyy-MM-dd') : '',
            });
        } else if (open && !saving) {
            reset({
                name: '',
                goal: 0,
                current: 0,
                monthlyContribution: 0,
                targetDate: '',
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

