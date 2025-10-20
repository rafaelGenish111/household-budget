import { Card, CardContent, Typography, Box, Chip, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import { MoreVert, CalendarToday, Edit, Delete, AutoMode, Schedule, Warning } from '@mui/icons-material';
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
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
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

                <Divider sx={{ my: 2 }} />
                <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block">תשלום חודשי</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">₪{commitment.monthlyPayment.toLocaleString()}</Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1.5} p={1.5} sx={{ backgroundColor: daysUntilBilling <= 3 ? 'error.light' : 'primary.light', borderRadius: 1.5, border: 1, borderColor: daysUntilBilling <= 3 ? 'error.main' : 'primary.main' }} mb={2}>
                    {daysUntilBilling <= 3 ? <Warning color="error" /> : <CalendarToday color="primary" />}
                    <Box flexGrow={1}>
                        <Typography variant="caption" display="block" fontWeight="medium">חיוב הבא</Typography>
                        <Typography variant="body2" fontWeight="bold">{format(nextBilling, 'dd/MM/yyyy', { locale: he })}</Typography>
                    </Box>
                    <Chip label={`עוד ${daysUntilBilling} ימים`} size="small" color={daysUntilBilling <= 3 ? 'error' : 'default'} />
                </Box>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}><Schedule fontSize="small" color="action" /><Typography variant="caption" color="text.secondary">חיוב ב-{commitment.billingDay} לכל חודש</Typography></Box>
                    {commitment.autoCreateTransaction && (<Box display="flex" alignItems="center" gap={1}><AutoMode fontSize="small" color="success" /><Typography variant="caption" color="success.main">יצירה אוטומטית פעילה</Typography></Box>)}
                    {commitment.isTimeLimited && commitment.endDate && (<Typography variant="caption" color="warning.main">⏰ מסתיים ב-{format(new Date(commitment.endDate), 'dd/MM/yyyy', { locale: he })}</Typography>)}
                </Box>
                {commitment.description && (<><Divider sx={{ my: 2 }} /><Typography variant="body2" color="text.secondary">{commitment.description}</Typography></>)}
            </CardContent>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { handleMenuClose(); onEdit(commitment); }}><Edit fontSize="small" sx={{ mr: 1 }} />ערוך</MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); onDelete(commitment); }} sx={{ color: 'error.main' }}><Delete fontSize="small" sx={{ mr: 1 }} />מחק</MenuItem>
            </Menu>
        </Card>
    );
};

export default CommitmentCard;


