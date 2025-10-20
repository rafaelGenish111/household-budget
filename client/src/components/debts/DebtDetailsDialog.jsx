import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Grid, Chip, Divider } from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import PaymentHistory from './PaymentHistory';

const DebtDetailsDialog = ({ open, onClose, debt }) => {
    if (!debt) return null;

    const categoryLabels = { personal: 'אישי', family: 'משפחה', bank: 'בנק', business: 'עסקי', other: 'אחר' };
    const priorityLabels = { low: 'נמוך', medium: 'בינוני', high: 'גבוה', urgent: 'דחוף' };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>פרטי חוב - {debt.creditorName}</DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box display="flex" gap={1} mb={2}>
                            <Chip label={debt.type === 'owe' ? 'אני חייב' : 'חייבים לי'} color={debt.type === 'owe' ? 'error' : 'success'} />
                            <Chip label={categoryLabels[debt.category]} />
                            <Chip label={`עדיפות: ${priorityLabels[debt.priority]}`} />
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">סכום מקורי</Typography>
                        <Typography variant="h6">₪{debt.originalAmount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">סכום נותר</Typography>
                        <Typography variant="h6" color={debt.type === 'owe' ? 'error.main' : 'success.main'}>₪{debt.remainingAmount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">שולם עד כה</Typography>
                        <Typography variant="h6">₪{(debt.totalPaid || (debt.originalAmount - debt.remainingAmount)).toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">התקדמות</Typography>
                        <Typography variant="h6">{debt.progressPercentage || Math.round(((debt.originalAmount - debt.remainingAmount) / (debt.originalAmount || 1)) * 100)}%</Typography>
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">תאריך התחלה</Typography>
                        <Typography variant="body1">{format(new Date(debt.startDate || new Date()), 'dd/MM/yyyy', { locale: he })}</Typography>
                    </Grid>
                    {debt.dueDate && (
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">תאריך יעד</Typography>
                            <Typography variant="body1">{format(new Date(debt.dueDate), 'dd/MM/yyyy', { locale: he })}</Typography>
                        </Grid>
                    )}

                    {debt.interestRate > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">ריבית שנתית</Typography>
                            <Typography variant="body1">{debt.interestRate}%</Typography>
                        </Grid>
                    )}

                    {debt.description && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>תיאור</Typography>
                            <Typography variant="body1">{debt.description}</Typography>
                        </Grid>
                    )}

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
                    <Grid item xs={12}><PaymentHistory payments={debt.payments} /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>סגור</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtDetailsDialog;


