import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showSnackbar, setShowSnackbar] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowSnackbar(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowSnackbar(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <Snackbar
            open={showSnackbar}
            autoHideDuration={4000}
            onClose={() => setShowSnackbar(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert
                severity={isOnline ? 'success' : 'warning'}
                icon={isOnline ? <Wifi /> : <WifiOff />}
                onClose={() => setShowSnackbar(false)}
            >
                {isOnline ? 'חזרת לאינטרנט' : 'אין חיבור לאינטרנט - עובד במצב אופליין'}
            </Alert>
        </Snackbar>
    );
};

export default OfflineIndicator;
