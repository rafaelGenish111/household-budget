import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { authService } from '../services/authService';
import { login, logout } from '../store/slices/authSlice';

export const useAuth = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, user, isLoading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        // Check if user is logged in on app start
        const token = authService.getToken();
        const storedUser = authService.getCurrentUser();

        if (token && storedUser) {
            // Verify token with server
            authService.getMe()
                .then((response) => {
                    dispatch(login({
                        user: response.user,
                        token
                    }));
                })
                .catch(() => {
                    // Token is invalid, logout
                    authService.logout();
                    dispatch(logout());
                });
        }
    }, [dispatch]);

    const loginUser = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            dispatch(login(response));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'שגיאה בהתחברות'
            };
        }
    };

    const logoutUser = () => {
        authService.logout();
        dispatch(logout());
    };

    const registerUser = async (userData) => {
        try {
            const response = await authService.register(userData);
            dispatch(login(response));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'שגיאה בהרשמה'
            };
        }
    };

    return {
        isAuthenticated,
        user,
        isLoading,
        error,
        loginUser,
        logoutUser,
        registerUser
    };
};
