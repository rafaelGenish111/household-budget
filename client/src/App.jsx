import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { Provider } from 'react-redux';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useSelector } from 'react-redux';
import { store } from './store/store';
import { getTheme } from './theme/theme';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';

// PWA Components
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import JoinHousehold from './pages/JoinHousehold';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import TransactionsList from './pages/Transactions/TransactionsList';
import SavingsList from './pages/Savings/SavingsList';
import Commitments from './pages/Commitments/Commitments';
import BudgetGoals from './pages/Goals/BudgetGoals';
import Settings from './pages/Settings/Settings';

// Create RTL cache
const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return isAuthenticated ? children : <Navigate to="/login" />;
};

// App Content (needs to be inside Provider to access Redux)
const AppContent = () => {
    const { mode } = useSelector((state) => state.theme);
    const theme = getTheme(mode);

    return (
        <CustomThemeProvider>
            <CacheProvider value={cacheRtl}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <BrowserRouter>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />
                            <Route path="/join/:token" element={<JoinHousehold />} />

                            {/* Protected Routes */}
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <Layout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="/dashboard" replace />} />
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="transactions" element={<TransactionsList />} />
                                <Route path="savings" element={<SavingsList />} />
                                <Route path="commitments" element={<Commitments />} />
                                <Route path="goals" element={<BudgetGoals />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </ThemeProvider>
            </CacheProvider>
        </CustomThemeProvider>
    );
};

function App() {
    return (
        <Provider store={store}>
            <PWAInstallPrompt />
            <OfflineIndicator />
            <AppContent />
        </Provider>
    );
}

export default App;

