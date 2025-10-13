import { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';

export default function UpdateToast() {
    const [open, setOpen] = useState(false);
    const [waitingSW, setWaitingSW] = useState(null);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((reg) => {
                if (!reg) return;
                reg.addEventListener('updatefound', () => {
                    const sw = reg.installing;
                    if (!sw) return;
                    sw.addEventListener('statechange', () => {
                        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                            setWaitingSW(sw);
                            setOpen(true);
                        }
                    });
                });
            });
        }
    }, []);

    const handleRefresh = () => {
        if (waitingSW) {
            waitingSW.postMessage({ type: 'SKIP_WAITING' });
            waitingSW.addEventListener('statechange', (e) => {
                if (e.target.state === 'activated') {
                    window.location.reload();
                }
            });
        }
    };

    return (
        <Snackbar open={open} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert severity="info" action={<Button color="inherit" size="small" onClick={handleRefresh}>רענן</Button>}>
                גרסה חדשה זמינה. רענן כדי לעדכן.
            </Alert>
        </Snackbar>
    );
}

