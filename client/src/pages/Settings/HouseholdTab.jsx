import { useState } from 'react';
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
} from '@mui/material';
import { Delete, PersonAdd } from '@mui/icons-material';
import { useSelector } from 'react-redux';

const HouseholdTab = () => {
    const { user } = useSelector((state) => state.auth);
    const [householdName, setHouseholdName] = useState('משק הבית שלי');
    const [inviteEmail, setInviteEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Mock members - in production, fetch from API
    const members = [
        { id: 1, name: user?.name, email: user?.email, role: 'admin' },
    ];

    const handleSave = () => {
        setSuccessMessage('שם משק הבית עודכן בהצלחה!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleInvite = () => {
        if (!inviteEmail) return;
        // TODO: Implement invite logic
        setSuccessMessage(`הזמנה נשלחה ל-${inviteEmail}`);
        setInviteEmail('');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

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
                {members.map((member) => (
                    <ListItem key={member.id}>
                        <ListItemText
                            primary={member.name}
                            secondary={member.email}
                        />
                        <ListItemSecondaryAction>
                            <Chip
                                label={member.role === 'admin' ? 'מנהל' : 'חבר'}
                                color={member.role === 'admin' ? 'primary' : 'default'}
                                size="small"
                                sx={{ mr: 1 }}
                            />
                            {member.role !== 'admin' && (
                                <IconButton edge="end" color="error">
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
                <Box display="flex" gap={2}>
                    <TextField
                        fullWidth
                        label="אימייל"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={handleInvite}
                    >
                        הזמן
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default HouseholdTab;

