import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { ArrowBack, Email } from '@mui/icons-material';
import { authService } from '../../services/authService';
import { loginSchema } from '../../utils/validators';

const ForgotPassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(loginSchema.pick(['email'])),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await authService.forgotPassword(data.email);
            setMessage('קישור לאיפוס סיסמה נשלח לאימייל שלך');
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה בשליחת בקשת איפוס סיסמה');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Email sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography component="h1" variant="h5" fontWeight="bold">
                            שכחתי סיסמה
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
                    </Typography>

                    {message && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {message}
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            {...register('email')}
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="כתובת אימייל"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            sx={{ mb: 2 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isLoading}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'שלח קישור לאיפוס סיסמה'
                            )}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Button
                                    startIcon={<ArrowBack />}
                                    variant="text"
                                    color="primary"
                                >
                                    חזרה להתחברות
                                </Button>
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default ForgotPassword;
