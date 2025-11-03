import { useEffect, useState, useCallback } from 'react';
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
    Slider,
    Box,
    Card,
    CardContent,
    CardMedia,
    Alert,
    Autocomplete,
    CircularProgress,
} from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import {
    createTransaction,
    updateTransaction,
} from '../../store/slices/transactionsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { goalService } from '../../services/goalService';
import ReceiptScanner from '../../components/forms/ReceiptScanner';

const schema = yup.object({
    type: yup.string().required('נא לבחור סוג'),
    category: yup.string().required('נא לבחור קטגוריה'),
    subcategory: yup.string(),
    amount: yup.number().required('נא להזין סכום').positive('הסכום חייב להיות חיובי'),
    date: yup.date().required('נא לבחור תאריך'),
    description: yup.string(),
    paymentMethod: yup.string().required('נא לבחור אמצעי תשלום'),
    installments: yup.number().min(1).max(36),
});

const paymentMethods = ['מזומן', 'אשראי', 'העברה בנקאית', "צ'ק", 'אחר'];

const AddTransactionDialog = ({ open, onClose, transaction, defaultType }) => {
    const dispatch = useDispatch();
    const { categories } = useSelector((state) => state.categories);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [budgetInfo, setBudgetInfo] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            type: transaction?.type || defaultType || 'expense',
            category: transaction?.category || '',
            subcategory: transaction?.subcategory || '',
            amount: transaction?.amount || 0,
            date: transaction?.date ?
                (transaction.date && !isNaN(new Date(transaction.date).getTime()) ?
                    format(new Date(transaction.date), 'yyyy-MM-dd') :
                    format(new Date(), 'yyyy-MM-dd')) :
                format(new Date(), 'yyyy-MM-dd'),
            description: transaction?.description || '',
            paymentMethod: transaction?.paymentMethod || 'מזומן',
            installments: transaction?.installments || 1,
        },
    });

    const watchType = watch('type');
    const watchCategory = watch('category');
    const watchAmount = watch('amount');
    const watchPaymentMethod = watch('paymentMethod');
    const watchInstallments = watch('installments');

    useEffect(() => {
        if (open) {
            dispatch(fetchCategories());
            if (transaction) {
                reset({
                    type: transaction.type,
                    category: transaction.category,
                    subcategory: transaction.subcategory || '',
                    amount: transaction.amount,
                    date: transaction.date && !isNaN(new Date(transaction.date).getTime()) ?
                        format(new Date(transaction.date), 'yyyy-MM-dd') :
                        format(new Date(), 'yyyy-MM-dd'),
                    description: transaction.description || '',
                    paymentMethod: transaction.paymentMethod,
                    installments: transaction.installments || 1,
                });
            }
        }
    }, [open, transaction, dispatch, reset]);

    // Fetch budget info when category or amount changes (for expenses only)
    useEffect(() => {
        if (watchType === 'expense' && watchCategory) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            goalService
                .getRemainingBudget(currentMonth, watchCategory)
                .then((response) => {
                    setBudgetInfo(response);
                })
                .catch(() => {
                    setBudgetInfo(null);
                });
        } else {
            setBudgetInfo(null);
        }
    }, [watchType, watchCategory]);

    const handleScanComplete = useCallback((scannedData) => {
        // Use requestAnimationFrame to batch updates and prevent flickering
        requestAnimationFrame(() => {
            // עדכון השדות עם הנתונים שנסרקו
            if (scannedData.date) {
                try {
                    const dateObj = new Date(scannedData.date);
                    if (!isNaN(dateObj.getTime())) {
                        setValue('date', format(dateObj, 'yyyy-MM-dd'), { shouldDirty: true });
                    }
                } catch (error) {
                    console.error('Invalid date from scanner:', scannedData.date);
                }
            }
            if (scannedData.total) {
                setValue('amount', scannedData.total, { shouldDirty: true });
            }
            if (scannedData.category) {
                setValue('category', scannedData.category, { shouldDirty: true });
            }
            if (scannedData.subcategory) {
                setValue('subcategory', scannedData.subcategory, { shouldDirty: true });
            }
            if (scannedData.businessName) {
                setValue('description', scannedData.businessName, { shouldDirty: true });
            }

            // שמירת מידע על החשבונית
            setReceiptData(scannedData);
            setShowScanner(false);
        });
    }, [setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const transactionData = { ...data };

            // אם יש חשבונית מצורפת, הוסף את ה-ID
            if (receiptData?.receiptId) {
                transactionData.receipt = receiptData.receiptId;
            }

            if (transaction?._id) {
                await dispatch(updateTransaction({ id: transaction._id, data: transactionData }));
            } else {
                await dispatch(createTransaction(transactionData));
            }
            onClose();
            reset();
            setReceiptData(null);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories
        .filter((cat) => cat.type === watchType)
        .reduce((unique, cat) => {
            // בדוק אם הקטגוריה כבר קיימת (לפי שם)
            if (!unique.find(c => c.name === cat.name)) {
                unique.push(cat);
            }
            return unique;
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name, 'he'));

    const selectedCategory = categories.find((cat) => cat.name === watchCategory);
    const subcategories = selectedCategory?.subcategories || [];

    const installmentAmount = watchInstallments > 1 ? watchAmount / watchInstallments : watchAmount;

    // Calculate balance after transaction
    const balanceAfter = budgetInfo ? budgetInfo.remaining - watchAmount : null;
    const isOverBudget = balanceAfter !== null && balanceAfter < 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {transaction?._id ? 'עריכת תנועה' : 'הוספת תנועה חדשה'}
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    {/* כפתור סריקת חשבונית */}
                    <Button
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={() => setShowScanner(true)}
                        fullWidth
                        sx={{ mb: 3 }}
                        color="primary"
                    >
                        📸 סרוק חשבונית
                    </Button>

                    <Grid container spacing={2}>
                        {/* Type */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        select
                                        label="סוג"
                                        error={!!errors.type}
                                        helperText={errors.type?.message}
                                    >
                                        <MenuItem value="income">הכנסה</MenuItem>
                                        <MenuItem value="expense">הוצאה</MenuItem>
                                    </TextField>
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
                                        label="תאריך"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.date}
                                        helperText={errors.date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Category */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        {...field}
                                        options={filteredCategories.map((cat) => cat.name)}
                                        freeSolo
                                        disableAutoFocus
                                        openOnFocus={false}
                                        onChange={(e, value) => {
                                            field.onChange(value || '');
                                            setValue('subcategory', '');
                                        }}
                                        ListboxProps={{
                                            style: {
                                                maxHeight: '300px',
                                                overflow: 'auto',
                                            },
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="קטגוריה"
                                                error={!!errors.category}
                                                helperText={errors.category?.message}
                                                autoComplete="off"
                                                inputProps={{
                                                    ...params.inputProps,
                                                    autoComplete: 'off',
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Subcategory */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="subcategory"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        select
                                        label="תת-קטגוריה"
                                        disabled={!watchCategory || subcategories.length === 0}
                                    >
                                        <MenuItem value="">ללא</MenuItem>
                                        {subcategories.map((sub) => (
                                            <MenuItem key={sub} value={sub}>
                                                {sub}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

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
                                        label="סכום"
                                        InputProps={{ startAdornment: '₪' }}
                                        error={!!errors.amount}
                                        helperText={errors.amount?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Payment Method */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="paymentMethod"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        select
                                        label="אמצעי תשלום"
                                        error={!!errors.paymentMethod}
                                        helperText={errors.paymentMethod?.message}
                                    >
                                        {paymentMethods.map((method) => (
                                            <MenuItem key={method} value={method}>
                                                {method}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Installments - Only for credit card */}
                        {watchPaymentMethod === 'אשראי' && (
                            <Grid item xs={12}>
                                <Typography gutterBottom>
                                    מספר תשלומים: {watchInstallments}
                                </Typography>
                                <Controller
                                    name="installments"
                                    control={control}
                                    render={({ field }) => (
                                        <Slider
                                            {...field}
                                            min={1}
                                            max={36}
                                            marks
                                            step={1}
                                            valueLabelDisplay="auto"
                                        />
                                    )}
                                />
                                {watchInstallments > 1 && (
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        תשלום חודשי: ₪{installmentAmount.toFixed(2)}
                                    </Typography>
                                )}
                            </Grid>
                        )}

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
                                    />
                                )}
                            />
                        </Grid>

                        {/* Live Budget Balance - Only for expenses */}
                        {watchType === 'expense' && budgetInfo && (
                            <Grid item xs={12}>
                                <Card
                                    sx={{
                                        bgcolor: isOverBudget ? 'error.light' : 'success.light',
                                        color: isOverBudget ? 'error.contrastText' : 'success.contrastText',
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            יתרה בקטגוריה: {watchCategory}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="body2">תקציב:</Typography>
                                                <Typography variant="h6">
                                                    ₪{budgetInfo.budget.toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="body2">הוצא עד כה:</Typography>
                                                <Typography variant="h6">
                                                    ₪{budgetInfo.spent.toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="body2">יתרה לפני:</Typography>
                                                <Typography variant="h6">
                                                    ₪{budgetInfo.remaining.toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="body2">יתרה אחרי:</Typography>
                                                <Typography variant="h6" fontWeight="bold">
                                                    ₪{balanceAfter?.toLocaleString()}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        {isOverBudget && (
                                            <Alert severity="warning" sx={{ mt: 2 }}>
                                                ⚠️ שים לב! תנועה זו תגרום לחריגה מהתקציב
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                        {/* תצוגת חשבונית מצורפת */}
                        {receiptData?.imageUrl && (
                            <Grid item xs={12}>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary" gutterBottom>
                                        📎 חשבונית מצורפת
                                    </Typography>
                                    <Card sx={{ mt: 1 }}>
                                        <CardMedia
                                            component="img"
                                            image={receiptData.imageUrl}
                                            alt="Receipt"
                                            sx={{ maxHeight: 200, objectFit: 'contain', bgcolor: 'grey.100' }}
                                        />
                                    </Card>
                                </Box>
                            </Grid>
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
                        {transaction?._id ? 'עדכן' : 'הוסף'}
                    </Button>
                </DialogActions>
            </form>

            {/* קומפוננטת סריקת חשבונית */}
            <ReceiptScanner
                open={showScanner}
                onClose={() => setShowScanner(false)}
                onScanComplete={handleScanComplete}
            />
        </Dialog>
    );
};

export default AddTransactionDialog;

