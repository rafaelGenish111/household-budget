import { Box, Typography, List, ListItem, ListItemText, Chip, Divider } from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Payment } from '@mui/icons-material';

const PaymentHistory = ({ payments }) => {
    if (!payments || payments.length === 0) {
        return (
            <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">אין תשלומים עדיין</Typography>
            </Box>
        );
    }

    const sortedPayments = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                היסטוריית תשלומים ({payments.length})
            </Typography>
            <List>
                {sortedPayments.map((payment, index) => (
                    <Box key={index}>
                        <ListItem>
                            <Payment sx={{ mr: 2, color: 'success.main' }} />
                            <ListItemText
                                primary={
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="bold">₪{payment.amount.toLocaleString()}</Typography>
                                        <Chip label={payment.paymentMethod} size="small" />
                                    </Box>
                                }
                                secondary={
                                    <>
                                        <Typography variant="caption" component="span">
                                            {format(new Date(payment.date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                        </Typography>
                                        {payment.note && (
                                            <>
                                                <br />
                                                <Typography variant="caption" component="span">{payment.note}</Typography>
                                            </>
                                        )}
                                    </>
                                }
                            />
                        </ListItem>
                        {index < sortedPayments.length - 1 && <Divider />}
                    </Box>
                ))}
            </List>
        </Box>
    );
};

export default PaymentHistory;


