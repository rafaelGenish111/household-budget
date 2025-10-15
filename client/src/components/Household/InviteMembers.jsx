import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    AlertTitle,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    Box,
    Typography,
} from '@mui/material';
import { Delete, ContentCopy } from '@mui/icons-material';
import api from '../../services/api';

const InviteMembers = ({ open, onClose }) => {
    const [email, setEmail] = useState('');
    const [inviteUrl, setInviteUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [invitations, setInvitations] = useState([]);

    useEffect(() => {
        if (open) {
            fetchInvitations();
        }
    }, [open]);

    const fetchInvitations = async () => {
        try {
            const response = await api.get('/household/invitations');
            setInvitations(response.data.invitations);
        } catch (err) {
            console.error('Error fetching invitations:', err);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInviteUrl(null);

        try {
            const response = await api.post('/household/invite', { email });
            
            if (response.data.invitation?.inviteUrl) {
                setInviteUrl(response.data.invitation.inviteUrl);
            }
            
            setEmail('');
            fetchInvitations();
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה בשליחת הזמנה');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (invitationId) => {
        try {
            await api.delete(`/household/invitation/${invitationId}`);
            fetchInvitations();
        } catch (err) {
            setError('שגיאה בביטול הזמנה');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteUrl);
        alert('הקישור הועתק ללוח!');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>הזמן חברי משק בית</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleInvite} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="כתובת אימייל"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'צור הזמנה'}
                    </Button>
                </Box>

                {inviteUrl && (
                    <Alert 
                        severity="success" 
                        sx={{ mt: 3 }}
                        action={
                            <IconButton
                                color="inherit"
                                size="small"
                                onClick={copyToClipboard}
                            >
                                <ContentCopy />
                            </IconButton>
                        }
                    >
                        <AlertTitle>הזמנה נוצרה בהצלחה!</AlertTitle>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            העתק את הקישור ושלח אותו למשתמש:
                        </Typography>
                        <Box 
                            sx={{ 
                                p: 1, 
                                bgcolor: 'rgba(0,0,0,0.1)', 
                                borderRadius: 1,
                                wordBreak: 'break-all',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                            }}
                        >
                            {inviteUrl}
                        </Box>
                    </Alert>
                )}

                {invitations.length > 0 && (
                    <>
                        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                            הזמנות ממתינות
                        </Typography>
                        <List>
                            {invitations.map((inv) => (
                                <ListItem
                                    key={inv._id}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleCancel(inv._id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={inv.email}
                                        secondary={`פג תוקף: ${new Date(
                                            inv.expiresAt
                                        ).toLocaleDateString('he-IL')}`}
                                    />
                                    <Chip label="ממתין" size="small" color="warning" />
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>סגור</Button>
            </DialogActions>
        </Dialog>
    );
};

export default InviteMembers;
