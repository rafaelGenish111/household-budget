import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, FormControlLabel, Checkbox, Typography, Box, Divider } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { format, parse, isValid } from 'date-fns';
import { createCommitment, updateCommitment } from '../../store/slices/commitmentsSlice';

const schema = yup.object({
    name: yup.string().required('נא להזין שם המנוי'),
    category: yup.string().required('נא לבחור קטגוריה'),
    subcategory: yup.string(),
    monthlyPayment: yup
        .number()
        .typeError('נא להזין סכום מספרי')
        .required('נא להזין סכום')
        .positive('הסכום חייב להיות חיובי'),
    billingDay: yup
        .number()
        .typeError('נא להזין יום חיוב כמספר')
        .required('נא להזין יום חיוב')
        .min(1, 'יום חיוב חייב להיות בין 1-31')
        .max(31, 'יום חיוב חייב להיות בין 1-31'),
    // נקבל כתו"ר וננרמל ב-onSubmit כדי לתמוך גם ב-dd/MM/yyyy
    startDate: yup.string().required('נא לבחור תאריך התחלה'),
    isTimeLimited: yup.boolean(),
    endDate: yup.string().nullable(),
    autoCreateTransaction: yup.boolean(),
    paymentMethod: yup.string(),
    description: yup.string(),
});

const paymentMethods = ['מזומן', 'אשראי', 'העברה בנקאית', "צ'ק", 'אחר'];

const AddCommitmentDialog = ({ open, onClose, commitment }) => {
    const dispatch = useDispatch();
    const { categories } = useSelector((state) => state.categories);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            category: '',
            subcategory: '',
            monthlyPayment: 0,
            billingDay: new Date().getDate(),
            startDate: format(new Date(), 'yyyy-MM-dd'),
            isTimeLimited: false,
            endDate: '',
            autoCreateTransaction: true,
            paymentMethod: 'אשראי',
            description: '',
        },
    });

    const watchCategory = watch('category');
    const watchIsTimeLimited = watch('isTimeLimited');

    useEffect(() => {
        if (commitment) {
            reset({
                name: commitment.name,
                category: commitment.category,
                subcategory: commitment.subcategory || '',
                monthlyPayment: commitment.monthlyPayment,
                billingDay: commitment.billingDay,
                startDate: format(new Date(commitment.startDate), 'yyyy-MM-dd'),
                isTimeLimited: commitment.isTimeLimited || false,
                endDate: commitment.endDate ? format(new Date(commitment.endDate), 'yyyy-MM-dd') : '',
                autoCreateTransaction: commitment.autoCreateTransaction !== false,
                paymentMethod: commitment.paymentMethod || 'אשראי',
                description: commitment.description || '',
            });
        }
    }, [commitment, reset, open]);

    const onSubmit = async (data) => {
        console.log('onSubmit called with data:', data);
        setIsSubmitting(true);
        try {
            // Normalize and validate values
            // startDate may arrive as 'yyyy-MM-dd' or 'dd/MM/yyyy' – normalize to 'yyyy-MM-dd'
            let normalizedStartDate = data.startDate;
            if (typeof normalizedStartDate === 'string') {
                let parsed = normalizedStartDate.includes('/')
                    ? parse(normalizedStartDate, 'dd/MM/yyyy', new Date())
                    : parse(normalizedStartDate, 'yyyy-MM-dd', new Date());
                if (!isValid(parsed)) parsed = new Date(normalizedStartDate);
                if (isValid(parsed)) normalizedStartDate = format(parsed, 'yyyy-MM-dd');
            }

            const submitData = {
                ...data,
                monthlyPayment: Number(data.monthlyPayment) || 0,
                billingDay: Number(data.billingDay) || 1,
                startDate: normalizedStartDate,
                endDate: data.isTimeLimited && data.endDate ? data.endDate : null,
            };
            console.log('Submitting data:', submitData);
            if (commitment?._id) {
                console.log('Updating commitment:', commitment._id);
                await dispatch(updateCommitment({ id: commitment._id, data: submitData }));
            } else {
                console.log('Creating new commitment');
                await dispatch(createCommitment(submitData));
            }
            console.log('Success! Closing dialog');
            onClose();
            reset();
        } catch (error) {
            console.error('Error in onSubmit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (formErrors) => {
        console.error('validation errors:', formErrors);
    };

    const expenseCategories = categories.filter((cat) => cat.type === 'expense');
    const selectedCategory = expenseCategories.find((cat) => cat.name === watchCategory);
    const subcategories = selectedCategory?.subcategories || [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{commitment?._id ? 'עריכת מנוי' : 'הוספת מנוי חדש'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller name="name" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth label="שם המנוי" placeholder="לדוגמה: נטפליקס, ספוטיפיי, חדר כושר" error={!!errors.name} helperText={errors.name?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="category" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth select label="קטגוריה" error={!!errors.category} helperText={errors.category?.message} onChange={(e) => { field.onChange(e); setValue('subcategory', ''); }}>
                                    {expenseCategories.map((cat) => (
                                        <MenuItem key={cat._id} value={cat.name}>
                                            <Box display="flex" alignItems="center" gap={1}><span>{cat.icon}</span><span>{cat.name}</span></Box>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="subcategory" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth select label="תת-קטגוריה" disabled={!watchCategory || subcategories.length === 0}>
                                    <MenuItem value="">ללא</MenuItem>
                                    {subcategories.map((sub) => (<MenuItem key={sub} value={sub}>{sub}</MenuItem>))}
                                </TextField>
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="monthlyPayment" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" label="תשלום חודשי" InputProps={{ startAdornment: '₪' }} error={!!errors.monthlyPayment} helperText={errors.monthlyPayment?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="billingDay" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" label="יום חיוב בחודש" inputProps={{ min: 1, max: 31 }} helperText="היום בחודש שבו אתה מחויב (1-31)" error={!!errors.billingDay} />
                            )} />
                        </Grid>
                        <Grid item xs={12}><Divider /></Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="startDate" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="date" label="תאריך התחלה" InputLabelProps={{ shrink: true }} error={!!errors.startDate} helperText={errors.startDate?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="paymentMethod" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth select label="אמצעי תשלום">
                                    {paymentMethods.map((m) => (<MenuItem key={m} value={m}>{m}</MenuItem>))}
                                </TextField>
                            )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="isTimeLimited" control={control} render={({ field }) => (
                                <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="מנוי מוגבל בזמן" />
                            )} />
                        </Grid>
                        {watchIsTimeLimited && (
                            <Grid item xs={12}>
                                <Controller name="endDate" control={control} render={({ field }) => (
                                    <TextField {...field} fullWidth type="date" label="תאריך סיום" InputLabelProps={{ shrink: true }} error={!!errors.endDate} helperText={errors.endDate?.message || 'המנוי יסתיים אוטומטית בתאריך זה'} />
                                )} />
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <Controller name="autoCreateTransaction" control={control} render={({ field }) => (
                                <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="צור טרנזקציה אוטומטית כל חודש" />
                            )} />
                            <Typography variant="caption" color="text.secondary" display="block" mt={-1}>המערכת תיצור אוטומטית הוצאה ביום החיוב בכל חודש</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="description" control={control} render={({ field }) => (
                                <TextField {...field} fullWidth multiline rows={2} label="הערות (אופציונלי)" error={!!errors.description} helperText={errors.description?.message} />
                            )} />
                        </Grid>
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

export default AddCommitmentDialog;


