import { useEffect, useState } from 'react';
import { Fab, Zoom } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setOpen(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // אם כבר מותקן/לא זכאי, לא נציג
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setOpen(false);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!open) return null;

  const onInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setOpen(false);
    // you can log outcome if needed
  };

  return (
    <Zoom in={open}>
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, left: 24, zIndex: 2000 }}
        onClick={onInstall}
        aria-label="התקן אפליקציה"
      >
        <GetAppIcon />
      </Fab>
    </Zoom>
  );
}

