import { useState, useEffect } from 'react';
import { Button, Snackbar, Box, Typography } from '@mui/material';
import { GetApp, Close } from '@mui/icons-material';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleClose = () => {
        setShowInstallPrompt(false);
    };

    return (
        <Snackbar
            open={showInstallPrompt}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ bottom: { xs: 80, sm: 24 } }}
        >
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    boxShadow: 3,
                }}
            >
                <GetApp />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                        התקן את האפליקציה
                    </Typography>
                    <Typography variant="body2">
                        קבל חוויה מהירה יותר ונוחה יותר
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleInstall}
                    sx={{ mr: 1 }}
                >
                    התקן
                </Button>
                <Button
                    onClick={handleClose}
                    sx={{ color: 'white', minWidth: 'auto', p: 1 }}
                >
                    <Close />
                </Button>
            </Box>
        </Snackbar>
    );
};

export default PWAInstallPrompt;
