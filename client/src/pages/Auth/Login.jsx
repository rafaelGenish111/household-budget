import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Link,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { login, clearError } from '../../store/slices/authSlice';

const schema = yup.object({
    email: yup.string().email('אימייל לא תקין').required('נא להזין אימייל'),
    password: yup.string().required('נא להזין סיסמה').min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים'),
});

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const onSubmit = async (data) => {
        await dispatch(login(data));
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Box textAlign="center" mb={3}>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        💰 ניהול משק בית
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        התחברות
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextField
                        fullWidth
                        label="אימייל"
                        type="email"
                        margin="normal"
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                    />

                    <TextField
                        fullWidth
                        label="סיסמה"
                        type="password"
                        margin="normal"
                        {...register('password')}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={isLoading}
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'התחבר'}
                    </Button>

                    <Box textAlign="center" mt={2}>
                        <Typography variant="body2">
                            <Link component={RouterLink} to="/forgot-password" underline="hover">
                                שכחתי סיסמה
                            </Link>
                        </Typography>
                        <Typography variant="body2" mt={1}>
                            אין לך חשבון?{' '}
                            <Link component={RouterLink} to="/register" underline="hover">
                                הירשם כאן
                            </Link>
                        </Typography>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default Login;

