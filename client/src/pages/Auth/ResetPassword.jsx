import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Lock, ArrowBack } from '@mui/icons-material';
import { authService } from '../../services/authService';
import * as yup from 'yup';

const resetPasswordSchema = yup.object().shape({
    password: yup
        .string()
        .min(6, 'סיסמה חייבת להכיל לפחות 6 תווים')
        .required('שדה חובה'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'סיסמאות אינן תואמות')
        .required('שדה חובה')
});

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(resetPasswordSchema),
    });

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await authService.resetPassword(token, data.password);
            setMessage('סיסמה אופסה בהצלחה! תוכל להתחבר עם הסיסמה החדשה');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה באיפוס הסיסמה');
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
                        <Lock sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography component="h1" variant="h5" fontWeight="bold">
                            איפוס סיסמה
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        הזן סיסמה חדשה עבור החשבון שלך
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
                            {...register('password')}
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="סיסמה חדשה"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            {...register('confirmPassword')}
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="אישור סיסמה"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
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
                                'אפס סיסמה'
                            )}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button
                                startIcon={<ArrowBack />}
                                variant="text"
                                color="primary"
                                onClick={() => navigate('/login')}
                            >
                                חזרה להתחברות
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default ResetPassword;
