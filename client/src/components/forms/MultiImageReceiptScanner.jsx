/**
 * Multi-Image Receipt Scanner - קומפוננטה לצילום חשבוניות ארוכות
 */

import React, { useState, useRef, useEffect } from 'react';
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
    LinearProgress,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Tooltip
} from '@mui/material';
import {
    CameraAlt,
    Upload,
    Close,
    CheckCircle,
    Warning,
    Add,
    Done,
    Visibility,
    Refresh,
    Delete
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';

export default function MultiImageReceiptScanner({ open, onClose, onScanComplete }) {
    const [session, setSession] = useState(null);
    const [currentPreview, setCurrentPreview] = useState(null);
    const [lastLines, setLastLines] = useState([]);
    const [overlapStatus, setOverlapStatus] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [receiptEndDetected, setReceiptEndDetected] = useState(false);
    const [tips, setTips] = useState([]);

    const fileInputRef = useRef(null);

    // טיפים לצילום טוב יותר
    const photographyTips = [
        'החזק את המכשיר ישר וקבוע',
        'ודא תאורה טובה - הימנע מצללים',
        'מלא את המסגרת עם החשבונית',
        'ודא שהטקסט קריא וברור',
        'הימנע מברקים או השתקפויות',
        'צלם במרחק של 20-30 ס"מ',
        'ודא שהחשבונית שטוחה ולא מקופלת'
    ];

    useEffect(() => {
        if (open && !session) {
            startNewSession();
        }
    }, [open]);

    const startNewSession = async () => {
        try {
            const response = await api.post('/multi-receipt/sessions', {
                settings: {
                    autoDetectEnd: true,
                    minOverlapConfidence: 0.6,
                    maxImages: 10
                }
            });

            setSession(response.data);
            setCurrentPreview(null);
            setLastLines([]);
            setOverlapStatus(null);
            setReceiptEndDetected(false);
            setTips(photographyTips);
        } catch (error) {
            console.error('Error creating session:', error);
            alert('שגיאה ביצירת סשן סריקה');
        }
    };

    const onDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        await captureImage(file);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.webp'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
    });

    const captureImage = async (file) => {
        if (!session) return;

        setProcessing(true);
        setOverlapStatus(null);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post(
                `/multi-receipt/sessions/${session.sessionId}/images`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const { parsedData, overlapAnalysis, receiptEndDetected: endDetected, lastLines: newLastLines } = response.data;

            // עדכון מצב הסשן
            setSession(prev => ({
                ...prev,
                imageCount: response.data.imageCount,
                status: response.data.sessionStatus
            }));

            // עדכון preview
            const reader = new FileReader();
            reader.onload = (e) => setCurrentPreview(e.target.result);
            reader.readAsDataURL(file);

            // עדכון שורות אחרונות
            setLastLines(newLastLines);

            // עדכון סטטוס חפיפה
            if (overlapAnalysis) {
                setOverlapStatus(overlapAnalysis);

                // עדכון טיפים בהתבסס על החפיפה
                if (overlapAnalysis.quality.level === 'poor') {
                    setTips([
                        'חפיפה חלשה - צלם שוב עם חפיפה גדולה יותר',
                        'ודא שהתמונה השנייה כוללת את 2-3 השורות האחרונות מהתמונה הראשונה',
                        'החזק את המכשיר באותו זווית כמו בתמונה הקודמת',
                        ...photographyTips.slice(3)
                    ]);
                } else if (overlapAnalysis.quality.level === 'excellent') {
                    setTips([
                        'חפיפה מעולה! המשך לצלם את שאר החשבונית',
                        ...photographyTips.slice(1)
                    ]);
                }
            }

            // בדיקת סוף חשבונית
            setReceiptEndDetected(endDetected);

        } catch (error) {
            console.error('Error capturing image:', error);
            alert(error.response?.data?.error || 'שגיאה בצילום התמונה');
        } finally {
            setProcessing(false);
        }
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

    const finishScanning = async () => {
        if (!session) return;

        setProcessing(true);

        try {
            const response = await api.post(`/multi-receipt/sessions/${session.sessionId}/complete`);

            const { mergedResult, validation, confidence } = response.data;

            // העברת התוצאות לקומפוננטה האב
            onScanComplete({
                ...mergedResult,
                validation,
                confidence,
                sessionId: session.sessionId,
                imageCount: response.data.imageCount,
                method: 'multi-image'
            });

            handleClose();

        } catch (error) {
            console.error('Error completing session:', error);
            alert(error.response?.data?.error || 'שגיאה בהשלמת הסריקה');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setSession(null);
        setCurrentPreview(null);
        setLastLines([]);
        setOverlapStatus(null);
        setProcessing(false);
        setShowGallery(false);
        setReceiptEndDetected(false);
        setTips(photographyTips);
        onClose();
    };

    const getProgressPercentage = () => {
        if (!session) return 0;
        return Math.min((session.imageCount / session.settings.maxImages) * 100, 100);
    };

    const getOverlapStatusColor = () => {
        if (!overlapStatus) return 'default';
        if (overlapStatus.quality.level === 'excellent') return 'success';
        if (overlapStatus.quality.level === 'good') return 'info';
        if (overlapStatus.quality.level === 'fair') return 'warning';
        return 'error';
    };

    const getOverlapStatusIcon = () => {
        if (!overlapStatus) return null;
        if (overlapStatus.quality.level === 'excellent' || overlapStatus.quality.level === 'good') {
            return <CheckCircle />;
        }
        return <Warning />;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth dir="rtl">
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">📸 סריקת חשבונית ארוכה</Typography>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {session && (
                    <Box>
                        {/* Progress Bar */}
                        <Box sx={{ mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                    תמונות: {session.imageCount} / {session.settings.maxImages}
                                </Typography>
                                <Typography variant="body2">
                                    {getProgressPercentage().toFixed(0)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={getProgressPercentage()}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>

                        {/* Receipt End Detection */}
                        {receiptEndDetected && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">
                                    🎯 זוהה סוף החשבונית! האם לסיים את הסריקה?
                                </Typography>
                            </Alert>
                        )}

                        {/* Main Content */}
                        <Grid container spacing={3}>
                            {/* Camera Section */}
                            <Grid item xs={12} md={8}>
                                <Card sx={{ p: 2 }}>
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
                                            תמונות: JPG, PNG, WEBP (עד 10MB)
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<CameraAlt />}
                                            onClick={handleCameraCapture}
                                            disabled={processing}
                                        >
                                            צלם תמונה
                                        </Button>
                                    </Box>
                                </Card>

                                {/* Processing Indicator */}
                                {processing && (
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CircularProgress size={24} />
                                        <Typography>מעבד תמונה...</Typography>
                                    </Box>
                                )}

                                {/* Overlap Status */}
                                {overlapStatus && (
                                    <Alert
                                        severity={overlapStatus.quality.level === 'excellent' || overlapStatus.quality.level === 'good' ? 'success' : 'warning'}
                                        sx={{ mt: 2 }}
                                        icon={getOverlapStatusIcon()}
                                    >
                                        <Typography variant="subtitle2">
                                            {overlapStatus.quality.level === 'excellent' ? 'חפיפה מעולה!' :
                                                overlapStatus.quality.level === 'good' ? 'חפיפה טובה' :
                                                    overlapStatus.quality.level === 'fair' ? 'חפיפה בינונית' : 'חפיפה חלשה'}
                                        </Typography>
                                        <Typography variant="body2">
                                            ביטחון: {(overlapStatus.overlap.confidence * 100).toFixed(0)}% |
                                            שורות חופפות: {overlapStatus.overlap.overlapLines.length}
                                        </Typography>
                                    </Alert>
                                )}
                            </Grid>

                            {/* Sidebar */}
                            <Grid item xs={12} md={4}>
                                <Stack spacing={2}>
                                    {/* Last Image Preview */}
                                    {currentPreview && (
                                        <Card>
                                            <CardMedia
                                                component="img"
                                                image={currentPreview}
                                                alt="Last captured image"
                                                sx={{ height: 200, objectFit: 'contain' }}
                                            />
                                            <Box sx={{ p: 2 }}>
                                                <Typography variant="subtitle2">
                                                    תמונה אחרונה ({session.imageCount})
                                                </Typography>
                                            </Box>
                                        </Card>
                                    )}

                                    {/* Last Lines */}
                                    {lastLines.length > 0 && (
                                        <Card sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                שורות אחרונות שזוהו:
                                            </Typography>
                                            <List dense>
                                                {lastLines.map((line, i) => (
                                                    <ListItem key={i} sx={{ py: 0.5 }}>
                                                        <ListItemText
                                                            primary={line}
                                                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Card>
                                    )}

                                    {/* Photography Tips */}
                                    <Card sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            💡 טיפים לצילום:
                                        </Typography>
                                        <List dense>
                                            {tips.slice(0, 4).map((tip, i) => (
                                                <ListItem key={i} sx={{ py: 0.5 }}>
                                                    <ListItemText
                                                        primary={tip}
                                                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Card>
                                </Stack>
                            </Grid>
                        </Grid>

                        {/* Action Buttons */}
                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleCameraCapture}
                                disabled={processing || !session.canAddMore}
                                size="large"
                            >
                                📸 צלם תמונה נוספת
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<Done />}
                                onClick={finishScanning}
                                disabled={session.imageCount === 0 || processing}
                                size="large"
                            >
                                ✓ סיימתי לצלם ({session.imageCount} תמונות)
                            </Button>

                            <Button
                                variant="text"
                                startIcon={<Visibility />}
                                onClick={() => setShowGallery(true)}
                                disabled={session.imageCount === 0}
                            >
                                🖼️ צפה בתמונות
                            </Button>
                        </Box>

                        {/* Instructions */}
                        {session.imageCount > 0 && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                                <Typography variant="body2" color="info.main">
                                    💡 <strong>המשך לצלם:</strong> צלם את המשך החשבונית, כולל את השורה:
                                    <strong> "{lastLines[lastLines.length - 1]}"</strong>
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>סגור</Button>
            </DialogActions>
        </Dialog>
    );
}
