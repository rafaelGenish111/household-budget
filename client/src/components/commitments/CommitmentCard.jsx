import { Card, CardContent, Typography, Box, Chip, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert, CalendarToday, Edit, Delete, AutoMode, Schedule } from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useState } from 'react';

const CommitmentCard = ({ commitment, onEdit, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const getNextBillingDate = () => {
        const today = new Date();
        const currentDay = today.getDate();
        if (currentDay < commitment.billingDay) return new Date(today.getFullYear(), today.getMonth(), commitment.billingDay);
        return new Date(today.getFullYear(), today.getMonth() + 1, commitment.billingDay);
    };
    const nextBilling = getNextBillingDate();
    const daysUntilBilling = Math.ceil((nextBilling.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                        <Typography variant="h6" gutterBottom>{commitment.name}</Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                            <Chip label={commitment.category} size="small" />
                            {commitment.subcategory && (<Chip label={commitment.subcategory} size="small" variant="outlined" />)}
                            {commitment.autoCreateTransaction && (<Chip icon={<AutoMode />} label="אוטומטי" size="small" color="primary" />)}
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={handleMenuOpen}><MoreVert /></IconButton>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary">תשלום חודשי</Typography>
                    <Typography variant="h5" color="primary">₪{commitment.monthlyPayment.toLocaleString()}</Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} p={1.5} sx={{ backgroundColor: daysUntilBilling <= 3 ? 'error.light' : 'grey.100', borderRadius: 1, mt: 'auto' }}>
                    <CalendarToday fontSize="small" />
                    <Box>
                        <Typography variant="caption" display="block">חיוב הבא</Typography>
                        <Typography variant="body2" fontWeight="bold">{format(nextBilling, 'dd/MM/yyyy', { locale: he })} ({daysUntilBilling} ימים)</Typography>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1}><Schedule fontSize="small" color="action" /><Typography variant="caption">חיוב ב-{commitment.billingDay} לכל חודש</Typography></Box>
                {commitment.isTimeLimited && commitment.endDate && (<Typography variant="caption" color="text.secondary">מסתיים ב-{format(new Date(commitment.endDate), 'dd/MM/yyyy', { locale: he })}</Typography>)}
                {commitment.description && (<Typography variant="body2" color="text.secondary" mt={1}>{commitment.description}</Typography>)}
            </CardContent>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { handleMenuClose(); onEdit(commitment); }}><Edit fontSize="small" sx={{ mr: 1 }} />ערוך</MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); onDelete(commitment); }} sx={{ color: 'error.main' }}><Delete fontSize="small" sx={{ mr: 1 }} />מחק</MenuItem>
            </Menu>
        </Card>
    );
};

export default CommitmentCard;


