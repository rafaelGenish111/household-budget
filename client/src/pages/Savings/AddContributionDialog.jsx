import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Typography,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { addContribution } from '../../store/slices/savingsSlice';

const AddContributionDialog = ({ open, onClose, saving }) => {
    const dispatch = useDispatch();
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum <= 0) {
            setError('נא להזין סכום תקין');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(addContribution({ id: saving._id, amount: amountNum }));
            setAmount('');
            setError('');
            onClose();
        } catch (error) {
            console.error('Error:', error);
            setError('שגיאה בהוספת תרומה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setError('');
        onClose();
    };

    if (!saving) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>הוספת תרומה - {saving.name}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    סכום נוכחי: ₪{saving.current.toLocaleString()} / ₪{saving.goal.toLocaleString()}
                </Typography>
                <TextField
                    fullWidth
                    type="number"
                    label="סכום תרומה"
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                    }}
                    InputProps={{ startAdornment: '₪' }}
                    error={!!error}
                    helperText={error}
                    autoFocus
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>ביטול</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={isSubmitting && <CircularProgress size={20} />}
                >
                    הוסף
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddContributionDialog;

