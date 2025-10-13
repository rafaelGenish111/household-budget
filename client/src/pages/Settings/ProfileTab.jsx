import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';

const ProfileTab = () => {
    const { user } = useSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // TODO: Implement profile update
        setSuccessMessage('פרופיל עודכן בהצלחה!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                פרטי פרופיל
            </Typography>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="שם מלא"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="אימייל"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button variant="contained" onClick={handleSave}>
                        שמור שינויים
                    </Button>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="h6" mt={2} mb={2}>
                        שינוי סיסמה
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="סיסמה נוכחית" type="password" />
                </Grid>

                <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="סיסמה חדשה" type="password" />
                </Grid>

                <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="אישור סיסמה חדשה" type="password" />
                </Grid>

                <Grid item xs={12}>
                    <Button variant="outlined">שנה סיסמה</Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProfileTab;

