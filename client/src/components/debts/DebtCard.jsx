import { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    LinearProgress,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    MoreVert,
    CalendarToday,
    TrendingUp,
    Edit,
    Delete,
    Payment,
    Warning,
} from '@mui/icons-material';
import { format, differenceInDays, isPast } from 'date-fns';
import { he } from 'date-fns/locale';

const DebtCard = ({ debt, onEdit, onDelete, onAddPayment, onOpenDetails }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const progress = debt.progressPercentage || Math.round(((debt.originalAmount - debt.remainingAmount) / (debt.originalAmount || 1)) * 100);
    const isOverdue = debt.dueDate && isPast(new Date(debt.dueDate)) && debt.status === 'active';
    const daysUntilDue = debt.dueDate ? differenceInDays(new Date(debt.dueDate), new Date()) : null;
    const isDueSoon = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7;

    const priorityColors = { low: 'success', medium: 'info', high: 'warning', urgent: 'error' };
    const priorityLabels = { low: 'נמוך', medium: 'בינוני', high: 'גבוה', urgent: 'דחוף' };
    const statusColors = { active: 'primary', paid: 'success', overdue: 'error' };
    const statusLabels = { active: 'פעיל', paid: 'שולם', overdue: 'באיחור' };

    return (
        <Card
            sx={{
                position: 'relative',
                height: '100%',
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                border: isOverdue ? 2 : 1,
                borderColor: isOverdue ? 'error.main' : 'divider',
                transition: 'box-shadow 0.2s, transform 0.1s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                cursor: onOpenDetails ? 'pointer' : 'default',
                borderRadius: 2,
            }}
            onClick={() => onOpenDetails && onOpenDetails(debt)}
        >
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Box>
                        <Typography variant="h6" gutterBottom>{debt.creditorName}</Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                            <Chip label={debt.type === 'owe' ? 'אני חייב' : 'חייבים לי'} color={debt.type === 'owe' ? 'error' : 'success'} size="small" />
                            <Chip label={statusLabels[debt.status]} color={statusColors[debt.status]} size="small" />
                            <Chip label={priorityLabels[debt.priority]} color={priorityColors[debt.priority]} size="small" />
                        </Box>
                    </Box>
                    <Tooltip title="פעולות">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e); }}>
                            <MoreVert />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Amounts */}
                <Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="text.secondary">סכום נותר</Typography>
                        <Typography variant="h6" color={debt.type === 'owe' ? 'error.main' : 'success.main'}>
                            ₪{debt.remainingAmount.toLocaleString()}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">מתוך ₪{debt.originalAmount.toLocaleString()}</Typography>
                </Box>

                {/* Progress */}
                <Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">התקדמות</Typography>
                        <Typography variant="caption" fontWeight="bold">{progress}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(Math.max(progress, 0), 100)}
                        sx={{ height: 8, borderRadius: 1, backgroundColor: 'grey.300', '& .MuiLinearProgress-bar': { backgroundColor: debt.type === 'owe' ? 'error.main' : 'success.main' } }}
                    />
                </Box>

                {/* Due Date */}
                {debt.dueDate && (
                    <Box display="flex" alignItems="center" gap={1} p={1} sx={{ backgroundColor: isOverdue ? 'error.light' : isDueSoon ? 'warning.light' : 'grey.100', borderRadius: 1, mt: 'auto' }}>
                        {isOverdue ? <Warning color="error" fontSize="small" /> : <CalendarToday fontSize="small" />}
                        <Typography variant="caption">
                            {isOverdue
                                ? `באיחור של ${Math.abs(daysUntilDue)} ימים`
                                : isDueSoon
                                    ? `נותרו ${daysUntilDue} ימים`
                                    : `יעד: ${format(new Date(debt.dueDate), 'dd/MM/yyyy', { locale: he })}`}
                        </Typography>
                    </Box>
                )}
            </CardContent>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} onClick={(e) => e.stopPropagation()}>
                {debt.status !== 'paid' && (
                    <MenuItem onClick={() => { handleMenuClose(); onAddPayment && onAddPayment(debt); }}>
                        <Payment fontSize="small" style={{ marginInlineEnd: 8 }} /> הוסף תשלום
                    </MenuItem>
                )}
                <MenuItem onClick={() => { handleMenuClose(); onEdit && onEdit(debt); }}>
                    <Edit fontSize="small" style={{ marginInlineEnd: 8 }} /> ערוך
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); onDelete && onDelete(debt); }} sx={{ color: 'error.main' }}>
                    <Delete fontSize="small" style={{ marginInlineEnd: 8 }} /> מחק
                </MenuItem>
            </Menu>
        </Card>
    );
};

export default DebtCard;


