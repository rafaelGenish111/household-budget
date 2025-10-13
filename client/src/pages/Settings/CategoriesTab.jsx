import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { fetchCategories, deleteCategory } from '../../store/slices/categoriesSlice';

const CategoriesTab = () => {
    const dispatch = useDispatch();
    const { categories } = useSelector((state) => state.categories);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleDelete = async (id, isDefault) => {
        if (isDefault) {
            alert('לא ניתן למחוק קטגוריות ברירת מחדל');
            return;
        }
        if (window.confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?')) {
            await dispatch(deleteCategory(id));
        }
    };

    const handleEdit = (category) => {
        if (category.isDefault) {
            alert('לא ניתן לערוך קטגוריות ברירת מחדל');
            return;
        }
        setSelectedCategory(category);
        setDialogOpen(true);
    };

    const customCategories = categories.filter((cat) => !cat.isDefault);
    const defaultCategories = categories.filter((cat) => cat.isDefault);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                קטגוריות
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                קטגוריות ברירת מחדל לא ניתנות לעריכה או מחיקה. ניתן להוסיף קטגוריות מותאמות אישית.
            </Alert>

            <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        קטגוריות מותאמות אישית
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedCategory(null);
                            setDialogOpen(true);
                        }}
                    >
                        הוסף קטגוריה
                    </Button>
                </Box>

                {customCategories.length === 0 ? (
                    <Typography color="text.secondary">אין קטגוריות מותאמות אישית</Typography>
                ) : (
                    <List>
                        {customCategories.map((category) => (
                            <ListItem
                                key={category._id}
                                secondaryAction={
                                    <Box>
                                        <IconButton size="small" onClick={() => handleEdit(category)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(category._id, category.isDefault)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={category.name}
                                    secondary={`${category.subcategories?.length || 0} תתי-קטגוריות`}
                                />
                                <Chip
                                    label={category.type === 'income' ? 'הכנסה' : 'הוצאה'}
                                    color={category.type === 'income' ? 'success' : 'error'}
                                    size="small"
                                    sx={{ mr: 2 }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                    קטגוריות ברירת מחדל
                </Typography>
                <List>
                    {defaultCategories.map((category) => (
                        <ListItem key={category._id}>
                            <ListItemText
                                primary={category.name}
                                secondary={`${category.subcategories?.length || 0} תתי-קטגוריות`}
                            />
                            <Chip
                                label={category.type === 'income' ? 'הכנסה' : 'הוצאה'}
                                color={category.type === 'income' ? 'success' : 'error'}
                                size="small"
                                sx={{ mr: 2 }}
                            />
                            <Chip label="ברירת מחדל" size="small" />
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Add/Edit Dialog - placeholder */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>
                    {selectedCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="שם הקטגוריה"
                        margin="normal"
                        defaultValue={selectedCategory?.name || ''}
                    />
                    <TextField
                        fullWidth
                        select
                        label="סוג"
                        margin="normal"
                        defaultValue={selectedCategory?.type || 'expense'}
                    >
                        <MenuItem value="income">הכנסה</MenuItem>
                        <MenuItem value="expense">הוצאה</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>ביטול</Button>
                    <Button variant="contained" onClick={() => setDialogOpen(false)}>
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CategoriesTab;

