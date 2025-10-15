import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Container,
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import { HomeWork } from '@mui/icons-material';
import api from '../services/api';

const JoinHousehold = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [invitation, setInvitation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        verifyInvitation();
    }, [token]);

    const verifyInvitation = async () => {
        try {
            const response = await api.get(`/auth/invitation/${token}`);
            setInvitation(response.data.invitation);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'הזמנה לא תקפה');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated && formData.password !== formData.confirmPassword) {
            setError('הסיסמאות אינן תואמות');
            return;
        }

        try {
            setLoading(true);

            if (isAuthenticated) {
                await api.post('/auth/accept-invitation', {
                    invitationToken: token,
                });
            } else {
                const response = await api.post('/auth/register-with-invitation', {
                    name: formData.name,
                    email: invitation.email,
                    password: formData.password,
                    invitationToken: token,
                });

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה בהצטרפות');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error && !invitation) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8 }}>
                    <Alert severity="error">{error}</Alert>
                    <Button onClick={() => navigate('/login')} sx={{ mt: 2 }}>
                        חזרה להתחברות
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <HomeWork sx={{ fontSize: 60, color: 'primary.main' }} />
                    </Box>

                    <Typography variant="h5" align="center" gutterBottom>
                        הזמנה למשק בית
                    </Typography>

                    <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
                        הוזמנת להצטרף למשק הבית "{invitation?.householdName}"
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        {!isAuthenticated && (
                            <>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="שם מלא"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="אימייל"
                                    value={invitation?.email}
                                    disabled
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    type="password"
                                    label="סיסמה"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    type="password"
                                    label="אימות סיסמה"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            confirmPassword: e.target.value,
                                        })
                                    }
                                />
                            </>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ mt: 3 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'הצטרף למשק בית'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default JoinHousehold;
