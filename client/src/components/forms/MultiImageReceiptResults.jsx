/**
 * Multi-Image Receipt Results - תצוגת תוצאות עם validation
 */

import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Alert,
    Button,
    Chip,
    Stack,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Divider,
    Paper,
    Tooltip,
    Badge
} from '@mui/material';
import {
    Edit,
    Delete,
    Add,
    CheckCircle,
    Warning,
    Error,
    Info,
    Refresh,
    Save,
    Cancel
} from '@mui/icons-material';

export default function MultiImageReceiptResults({ 
    result, 
    validation, 
    onEdit, 
    onRetake, 
    onSave,
    onClose 
}) {
    const [editing, setEditing] = useState(false);
    const [editedItems, setEditedItems] = useState(result.items || []);
    const [editedTotal, setEditedTotal] = useState(result.total || 0);
    const [editedBusinessName, setEditedBusinessName] = useState(result.businessInfo?.name || '');
    const [showEditDialog, setShowEditDialog] = useState(false);

    const getQualityColor = () => {
        if (validation.overallScore >= 0.8) return 'success';
        if (validation.overallScore >= 0.6) return 'warning';
        return 'error';
    };

    const getQualityLabel = () => {
        if (validation.overallScore >= 0.8) return 'מעולה';
        if (validation.overallScore >= 0.6) return 'טוב';
        if (validation.overallScore >= 0.4) return 'בינוני';
        return 'נמוך';
    };

    const getIssueIcon = (severity) => {
        switch (severity) {
            case 'high': return <Error color="error" />;
            case 'medium': return <Warning color="warning" />;
            case 'low': return <Info color="info" />;
            default: return <Info />;
        }
    };

    const handleEditItem = (index, field, value) => {
        const updatedItems = [...editedItems];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        };
        setEditedItems(updatedItems);
    };

    const handleAddItem = () => {
        setEditedItems([...editedItems, {
            description: '',
            price: 0,
            quantity: 1,
            unitPrice: 0,
            confidence: 0.5
        }]);
    };

    const handleDeleteItem = (index) => {
        const updatedItems = editedItems.filter((_, i) => i !== index);
        setEditedItems(updatedItems);
    };

    const handleSave = () => {
        const updatedResult = {
            ...result,
            items: editedItems,
            total: editedTotal,
            businessInfo: {
                ...result.businessInfo,
                name: editedBusinessName
            }
        };
        
        onSave(updatedResult);
        setEditing(false);
        setShowEditDialog(false);
    };

    const calculateItemsTotal = () => {
        return editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getTotalDifference = () => {
        const itemsTotal = calculateItemsTotal();
        return Math.abs(itemsTotal - editedTotal);
    };

    const getTotalDifferencePercentage = () => {
        const itemsTotal = calculateItemsTotal();
        if (editedTotal === 0) return 0;
        return (Math.abs(itemsTotal - editedTotal) / editedTotal) * 100;
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    תוצאות סריקת החשבונית
                </Typography>
                
                <Stack direction="row" spacing={2} alignItems="center">
                    <Chip 
                        label={`איכות: ${getQualityLabel()}`}
                        color={getQualityColor()}
                        icon={<CheckCircle />}
                    />
                    <Chip 
                        label={`ביטחון: ${(validation.overallScore * 100).toFixed(0)}%`}
                        color={getQualityColor()}
                    />
                    <Chip 
                        label={`${result.imageCount || 1} תמונות`}
                        color="info"
                    />
                    {result.method && (
                        <Chip 
                            label={`שיטה: ${result.method === 'overlap' ? 'חפיפה' : 'מיקום'}`}
                            color="secondary"
                        />
                    )}
                </Stack>
            </Box>

            {/* Validation Issues */}
            {validation.issues && validation.issues.length > 0 && (
                <Alert 
                    severity={validation.issues.some(i => i.severity === 'high') ? 'error' : 'warning'}
                    sx={{ mb: 3 }}
                >
                    <Typography variant="subtitle2" gutterBottom>
                        ⚠️ שים לב לבעיות הבאות:
                    </Typography>
                    <List dense>
                        {validation.issues.map((issue, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                                {getIssueIcon(issue.severity)}
                                <ListItemText 
                                    primary={issue.message}
                                    sx={{ ml: 1 }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Alert>
            )}

            {/* Recommendations */}
            {validation.recommendations && validation.recommendations.length > 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        💡 המלצות:
                    </Typography>
                    <List dense>
                        {validation.recommendations.map((rec, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText primary={`• ${rec}`} />
                            </ListItem>
                        ))}
                    </List>
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Business Info */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                מידע על העסק
                            </Typography>
                            
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        שם העסק
                                    </Typography>
                                    <Typography variant="body1">
                                        {editedBusinessName || 'לא זוהה'}
                                    </Typography>
                                </Box>
                                
                                {result.businessInfo?.taxId && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            ח.ע.מ
                                        </Typography>
                                        <Typography variant="body1">
                                            {result.businessInfo.taxId}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {result.businessInfo?.phone && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            טלפון
                                        </Typography>
                                        <Typography variant="body1">
                                            {result.businessInfo.phone}
                                        </Typography>
                                    </Box>
                                )}
                                
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        תאריך
                                    </Typography>
                                    <Typography variant="body1">
                                        {result.date ? new Date(result.date).toLocaleDateString('he-IL') : 'לא זוהה'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Total Amount */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                סכום כולל
                            </Typography>
                            
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" color="primary">
                                    ₪{editedTotal.toFixed(2)}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    סכום מחושב מפריטים: ₪{calculateItemsTotal().toFixed(2)}
                                </Typography>
                                
                                {getTotalDifference() > 0.01 && (
                                    <Typography 
                                        variant="body2" 
                                        color={getTotalDifferencePercentage() > 5 ? 'error.main' : 'warning.main'}
                                        sx={{ mt: 1 }}
                                    >
                                        הפרש: ₪{getTotalDifference().toFixed(2)} 
                                        ({getTotalDifferencePercentage().toFixed(1)}%)
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Items List */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6">
                                    פריטים ({editedItems.length})
                                </Typography>
                                
                                <Button
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => setShowEditDialog(true)}
                                >
                                    ערוך פריטים
                                </Button>
                            </Box>
                            
                            <List>
                                {editedItems.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem>
                                            <ListItemText
                                                primary={item.description}
                                                secondary={`כמות: ${item.quantity} | מחיר יחידה: ₪${item.unitPrice?.toFixed(2) || item.price.toFixed(2)}`}
                                            />
                                            <ListItemSecondaryAction>
                                                <Typography variant="h6" color="primary">
                                                    ₪{(item.price * item.quantity).toFixed(2)}
                                                </Typography>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < editedItems.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={onRetake}
                >
                    🔄 צלם מחדש
                </Button>
                
                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => onSave(result)}
                >
                    ✓ אשר ושמור
                </Button>
            </Box>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    עריכת פריטים
                </DialogTitle>
                
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {/* Business Name */}
                        <TextField
                            label="שם העסק"
                            value={editedBusinessName}
                            onChange={(e) => setEditedBusinessName(e.target.value)}
                            fullWidth
                        />
                        
                        {/* Total */}
                        <TextField
                            label="סכום כולל"
                            type="number"
                            value={editedTotal}
                            onChange={(e) => setEditedTotal(parseFloat(e.target.value) || 0)}
                            fullWidth
                        />
                        
                        {/* Items */}
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            פריטים
                        </Typography>
                        
                        {editedItems.map((item, index) => (
                            <Paper key={index} sx={{ p: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={5}>
                                        <TextField
                                            label="תיאור הפריט"
                                            value={item.description}
                                            onChange={(e) => handleEditItem(index, 'description', e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={6} md={2}>
                                        <TextField
                                            label="כמות"
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleEditItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                            fullWidth
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={6} md={2}>
                                        <TextField
                                            label="מחיר יחידה"
                                            type="number"
                                            value={item.unitPrice || item.price}
                                            onChange={(e) => {
                                                const unitPrice = parseFloat(e.target.value) || 0;
                                                handleEditItem(index, 'unitPrice', unitPrice);
                                                handleEditItem(index, 'price', unitPrice * item.quantity);
                                            }}
                                            fullWidth
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={6} md={2}>
                                        <Typography variant="h6" color="primary">
                                            ₪{(item.price * item.quantity).toFixed(2)}
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={6} md={1}>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteItem(index)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                        
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={handleAddItem}
                            sx={{ mt: 2 }}
                        >
                            הוסף פריט
                        </Button>
                    </Stack>
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={() => setShowEditDialog(false)}>
                        ביטול
                    </Button>
                    <Button onClick={handleSave} variant="contained">
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
