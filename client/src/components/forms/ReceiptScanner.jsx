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
    PictureAsPdf,
    ViewInAr,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';
import MultiImageReceiptScanner from './MultiImageReceiptScanner';

export default function ReceiptScanner({ open, onClose, onScanComplete }) {
    const [scanning, setScanning] = useState(false);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [multiImageMode, setMultiImageMode] = useState(false);

    const onDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];

        // אם זה PDF, הצג אייקון במקום תצוגה מקדימה
        if (file.type === 'application/pdf') {
            setPreview('PDF');
        } else {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
        }

        await scanReceipt(file);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.webp'],
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
    });

    const scanReceipt = async (file) => {
        setScanning(true);
        setError(null);
        // Don't clear result immediately to prevent flickering
        // setResult(null);

        try {
            const formData = new FormData();
            formData.append('receipt', file);

            const response = await api.post('/receipts/scan', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Use requestAnimationFrame to prevent flickering
            requestAnimationFrame(() => {
                setResult(response.data);
                setScanning(false);
            });
        } catch (err) {
            requestAnimationFrame(() => {
                setError(err.response?.data?.error || 'שגיאה בסריקת החשבונית');
                setScanning(false);
            });
            console.error(err);
        }
    };

    const handleUseData = () => {
        if (result) {
            // Use setTimeout to prevent flickering when closing
            setTimeout(() => {
                onScanComplete(result);
                handleClose();
            }, 100);
        }
    };

    const handleClose = () => {
        // Clear states with delay to prevent flickering
        setTimeout(() => {
            setPreview(null);
            setResult(null);
            setError(null);
            setScanning(false);
            onClose();
        }, 50);
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
        <>
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
                                    {isDragActive ? 'שחרר כאן...' : 'גרור קובץ או לחץ להעלאה'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    תומך ב-JPG, PNG, WEBP, PDF (עד 10MB)
                                </Typography>
                                <Chip
                                    label="חדש: תמיכה ב-PDF! 📄"
                                    color="success"
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<CameraAlt />}
                                    onClick={handleCameraCapture}
                                    sx={{ flex: 1 }}
                                >
                                    צלם חשבונית רגילה
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<ViewInAr />}
                                    onClick={() => setMultiImageMode(true)}
                                    sx={{ flex: 1 }}
                                >
                                    📸 חשבונית ארוכה
                                </Button>
                            </Box>

                            {/* טיפים לצילום טוב יותר */}
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                                <Typography variant="subtitle2" color="info.main" gutterBottom>
                                    💡 טיפים לצילום טוב יותר:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    • החזק את המכשיר ישר וקבוע<br />
                                    • ודא תאורה טובה - הימנע מצללים<br />
                                    • מלא את המסגרת עם החשבונית<br />
                                    • ודא שהטקסט קריא וברור<br />
                                    • הימנע מברקים או השתקפויות
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {preview && (
                        <Box>
                            <Card sx={{ mb: 2 }}>
                                {preview === 'PDF' ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: 4,
                                            bgcolor: 'grey.100',
                                        }}
                                    >
                                        <PictureAsPdf sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                                        <Typography variant="h6">קובץ PDF</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            הקובץ נסרק...
                                        </Typography>
                                    </Box>
                                ) : (
                                    <CardMedia
                                        component="img"
                                        image={preview}
                                        alt="Receipt preview"
                                        sx={{ maxHeight: 400, objectFit: 'contain' }}
                                    />
                                )}
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

                            {result && !scanning && (
                                <Box>
                                    <Alert
                                        severity={result.qualitySummary?.level === 'excellent' || result.qualitySummary?.level === 'good' ? 'success' :
                                            result.qualitySummary?.level === 'fair' ? 'warning' : 'error'}
                                        icon={result.qualitySummary?.level === 'excellent' || result.qualitySummary?.level === 'good' ? <CheckCircle /> : <Warning />}
                                        sx={{ mb: 2 }}
                                    >
                                        <Typography variant="subtitle2">
                                            {result.qualitySummary?.level === 'excellent' || result.qualitySummary?.level === 'good'
                                                ? 'חשבונית נסרקה בהצלחה!'
                                                : result.qualitySummary?.level === 'fair'
                                                    ? 'חלק מהנתונים לא זוהו - אנא בדוק'
                                                    : 'נדרש בדיקה ידנית של הנתונים'}
                                        </Typography>
                                        <Typography variant="caption">
                                            איכות: {result.qualitySummary?.label || 'לא ידוע'} ({(result.confidence * 100).toFixed(0)}%)
                                        </Typography>
                                        {result.processingTime && (
                                            <Typography variant="caption" display="block">
                                                זמן עיבוד: {result.processingTime}ms
                                            </Typography>
                                        )}
                                    </Alert>

                                    {/* הצגת אזהרות והצעות */}
                                    {result.validation?.issues?.length > 0 && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2">בעיות שזוהו:</Typography>
                                            {result.validation.issues.map((issue, idx) => (
                                                <Typography key={idx} variant="body2">• {issue}</Typography>
                                            ))}
                                        </Alert>
                                    )}

                                    {result.validation?.warnings?.length > 0 && (
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2">אזהרות:</Typography>
                                            {result.validation.warnings.map((warning, idx) => (
                                                <Typography key={idx} variant="body2">• {warning}</Typography>
                                            ))}
                                        </Alert>
                                    )}

                                    {result.suggestions?.length > 0 && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2">המלצות לשיפור:</Typography>
                                            {result.suggestions.map((suggestion, idx) => (
                                                <Typography key={idx} variant="body2">• {suggestion}</Typography>
                                            ))}
                                        </Alert>
                                    )}

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
                                            {result.itemsTotal && result.itemsTotal > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    סכום פריטים: ₪{result.itemsTotal.toFixed(2)}
                                                    {result.total && Math.abs(result.total - result.itemsTotal) > 0.01 && (
                                                        <span style={{ color: result.validation?.warnings?.length > 0 ? '#f57c00' : '#4caf50' }}>
                                                            {' '}(הפרש: ₪{Math.abs(result.total - result.itemsTotal).toFixed(2)})
                                                        </span>
                                                    )}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                שם העסק
                                            </Typography>
                                            <Typography variant="body1">
                                                {result.businessName || 'לא זוהה'}
                                            </Typography>
                                            {result.businessInfo?.taxId && (
                                                <Typography variant="caption" color="text.secondary">
                                                    ח.ע.מ: {result.businessInfo.taxId}
                                                </Typography>
                                            )}
                                            {result.businessInfo?.phone && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    טלפון: {result.businessInfo.phone}
                                                </Typography>
                                            )}
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
                                                            <Typography variant="body2">{item.description || item.name}</Typography>
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

                                        {/* מידע טכני למשתמשים מתקדמים */}
                                        {result.scanInfo && (
                                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    מידע טכני
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    {result.scanInfo.preprocessingApplied && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            ✓ עיבוד מקדים בוצע
                                                        </Typography>
                                                    )}
                                                    {result.scanInfo.attempt > 1 && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            ניסיון {result.scanInfo.attempt}
                                                        </Typography>
                                                    )}
                                                    {result.fallback && (
                                                        <Typography variant="caption" color="warning.main" display="block">
                                                            ⚠️ מצב fallback - Vision API לא זמין
                                                        </Typography>
                                                    )}
                                                    {result.error && (
                                                        <Typography variant="caption" color="error.main" display="block">
                                                            ❌ שגיאה בסריקה
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

            {/* Multi-Image Receipt Scanner */}
            <MultiImageReceiptScanner
                open={multiImageMode}
                onClose={() => setMultiImageMode(false)}
                onScanComplete={(multiImageResult) => {
                    onScanComplete(multiImageResult);
                    setMultiImageMode(false);
                }}
            />
        </>
    );
}

