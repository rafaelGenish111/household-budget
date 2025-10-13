import { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardMedia,
    CircularProgress,
    Typography,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Stack,
} from '@mui/material';
import {
    CameraAlt,
    Upload,
    Close,
    CheckCircle,
    Warning,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';

export default function ReceiptScanner({ open, onClose, onScanComplete }) {
    const [scanning, setScanning] = useState(false);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const onDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];

        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);

        await scanReceipt(file);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.heic'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
    });

    const scanReceipt = async (file) => {
        setScanning(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('receipt', file);

            const response = await api.post('/receipts/scan', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'שגיאה בסריקת החשבונית');
            console.error(err);
        } finally {
            setScanning(false);
        }
    };

    const handleUseData = () => {
        if (result) {
            onScanComplete(result);
            handleClose();
        }
    };

    const handleClose = () => {
        setPreview(null);
        setResult(null);
        setError(null);
        setScanning(false);
        onClose();
    };

    const handleCameraCapture = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                onDrop([e.target.files[0]]);
            }
        };
        input.click();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth dir="rtl">
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">📸 סריקת חשבונית</Typography>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {!preview && (
                    <Box>
                        <Box
                            {...getRootProps()}
                            sx={{
                                border: '2px dashed',
                                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                        >
                            <input {...getInputProps()} />
                            <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {isDragActive ? 'שחרר כאן...' : 'גרור תמונה או לחץ להעלאה'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                תומך ב-JPG, PNG, HEIC (עד 10MB)
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<CameraAlt />}
                                onClick={handleCameraCapture}
                                fullWidth
                            >
                                צלם חשבונית
                            </Button>
                        </Box>
                    </Box>
                )}

                {preview && (
                    <Box>
                        <Card sx={{ mb: 2 }}>
                            <CardMedia
                                component="img"
                                image={preview}
                                alt="Receipt preview"
                                sx={{ maxHeight: 400, objectFit: 'contain' }}
                            />
                        </Card>

                        {scanning && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    p: 3,
                                }}
                            >
                                <CircularProgress size={24} />
                                <Typography>סורק חשבונית...</Typography>
                            </Box>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {result && (
                            <Box>
                                <Alert
                                    severity={result.confidence > 0.7 ? 'success' : 'warning'}
                                    icon={result.confidence > 0.7 ? <CheckCircle /> : <Warning />}
                                    sx={{ mb: 2 }}
                                >
                                    <Typography variant="subtitle2">
                                        {result.confidence > 0.7
                                            ? 'חשבונית נסרקה בהצלחה!'
                                            : 'חלק מהנתונים לא זוהו - אנא בדוק'}
                                    </Typography>
                                    <Typography variant="caption">
                                        דיוק: {(result.confidence * 100).toFixed(0)}%
                                    </Typography>
                                </Alert>

                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            תאריך
                                        </Typography>
                                        <Typography variant="body1">
                                            {result.date && !isNaN(new Date(result.date).getTime())
                                                ? new Date(result.date).toLocaleDateString('he-IL')
                                                : 'לא זוהה'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            סכום כולל
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            {result.total ? `₪${result.total.toFixed(2)}` : 'לא זוהה'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            שם העסק
                                        </Typography>
                                        <Typography variant="body1">
                                            {result.businessName || 'לא זוהה'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            קטגוריה
                                        </Typography>
                                        <Box>
                                            <Chip label={result.category || 'אחר'} color="primary" size="small" />
                                        </Box>
                                    </Box>

                                    {result.items && result.items.length > 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                פריטים ({result.items.length})
                                            </Typography>
                                            <Box sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                                                {result.items.slice(0, 10).map((item, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            py: 0.5,
                                                            borderBottom: '1px solid',
                                                            borderColor: 'divider',
                                                        }}
                                                    >
                                                        <Typography variant="body2">{item.name}</Typography>
                                                        <Typography variant="body2">₪{item.price.toFixed(2)}</Typography>
                                                    </Box>
                                                ))}
                                                {result.items.length > 10 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                                        ועוד {result.items.length - 10} פריטים...
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                {preview && !scanning && (
                    <Button onClick={() => setPreview(null)}>סרוק שוב</Button>
                )}
                {result && (
                    <Button onClick={handleUseData} variant="contained" disabled={!result.total}>
                        השתמש בנתונים
                    </Button>
                )}
                <Button onClick={handleClose}>סגור</Button>
            </DialogActions>
        </Dialog>
    );
}

