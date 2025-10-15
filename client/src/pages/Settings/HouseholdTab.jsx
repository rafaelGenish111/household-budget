import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Delete, PersonAdd } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import InviteMembers from '../../components/Household/InviteMembers';
import api from '../../services/api';

const HouseholdTab = () => {
    const { user } = useSelector((state) => state.auth);
    const [householdName, setHouseholdName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [household, setHousehold] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHouseholdData();
    }, []);

    const fetchHouseholdData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/household');
            setHousehold(response.data.household);
            setHouseholdName(response.data.household.name);
        } catch (err) {
            setError('שגיאה בטעינת נתוני משק הבית');
            console.error('Error fetching household:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await api.put('/household', { name: householdName });
            setSuccessMessage('שם משק הבית עודכן בהצלחה!');
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchHouseholdData(); // Refresh data
        } catch (err) {
            setError('שגיאה בעדכון שם משק הבית');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (window.confirm('האם אתה בטוח שברצונך להסיר את המשתמש הזה?')) {
            try {
                await api.delete(`/household/member/${userId}`);
                setSuccessMessage('משתמש הוסר בהצלחה');
                setTimeout(() => setSuccessMessage(''), 3000);
                fetchHouseholdData(); // Refresh data
            } catch (err) {
                setError('שגיאה בהסרת המשתמש');
            }
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error">
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                פרטי משק בית
            </Typography>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            <TextField
                fullWidth
                label="שם משק הבית"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                sx={{ mb: 2 }}
            />

            <Button variant="contained" onClick={handleSave} sx={{ mb: 4 }}>
                שמור שינויים
            </Button>

            <Typography variant="h6" gutterBottom>
                חברי משק הבית
            </Typography>

            <List>
                {household?.members?.map((member) => (
                    <ListItem key={member.user._id}>
                        <ListItemText
                            primary={member.user.name}
                            secondary={member.user.email}
                        />
                        <ListItemSecondaryAction>
                            <Chip
                                label={member.role === 'admin' ? 'מנהל' : 'חבר'}
                                color={member.role === 'admin' ? 'primary' : 'default'}
                                size="small"
                                sx={{ mr: 1 }}
                            />
                            {member.role !== 'admin' && (
                                <IconButton
                                    edge="end"
                                    color="error"
                                    onClick={() => handleRemoveMember(member.user._id)}
                                >
                                    <Delete />
                                </IconButton>
                            )}
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                    הזמן חבר חדש
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => setInviteDialogOpen(true)}
                >
                    הזמן חבר משק בית
                </Button>
            </Box>

            <InviteMembers
                open={inviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
                onInviteSuccess={fetchHouseholdData}
            />
        </Box>
    );
};

export default HouseholdTab;

