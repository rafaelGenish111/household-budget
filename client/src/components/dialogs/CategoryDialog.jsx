import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    IconButton,
    Chip,
    Typography,
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
    name: yup.string().required('נא להזין שם קטגוריה'),
    type: yup.string().required('נא לבחור סוג'),
    icon: yup.string(),
    color: yup.string(),
});

const CategoryDialog = ({ open, onClose, onSave, category }) => {
    const [subcategories, setSubcategories] = useState([]);
    const [newSubcategory, setNewSubcategory] = useState('');

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            type: 'expense',
            icon: '📦',
            color: '#2196f3',
        },
    });

    useEffect(() => {
        if (category) {
            reset({
                name: category.name,
                type: category.type,
                icon: category.icon || '📦',
                color: category.color || '#2196f3',
            });
            setSubcategories(category.subcategories || []);
        } else {
            reset({
                name: '',
                type: 'expense',
                icon: '📦',
                color: '#2196f3',
            });
            setSubcategories([]);
        }
    }, [category, reset, open]);

    const handleAddSubcategory = () => {
        if (newSubcategory.trim() && !subcategories.includes(newSubcategory.trim())) {
            setSubcategories([...subcategories, newSubcategory.trim()]);
            setNewSubcategory('');
        }
    };

    const handleRemoveSubcategory = (index) => {
        setSubcategories(subcategories.filter((_, i) => i !== index));
    };

    const onSubmit = (data) => {
        onSave({
            ...data,
            subcategories,
        });
        onClose();
    };

    const commonIcons = ['🍔', '🚗', '🎮', '📄', '🏥', '📚', '🛍️', '🏠', '🎁', '💎', '📦', '💰', '📈', '💵'];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {category ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
                    {/* שם הקטגוריה */}
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="שם הקטגוריה"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                sx={{ mb: 2 }}
                            />
                        )}
                    />

                    {/* סוג */}
                    <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                select
                                label="סוג"
                                error={!!errors.type}
                                helperText={errors.type?.message}
                                sx={{ mb: 2 }}
                            >
                                <MenuItem value="expense">הוצאה</MenuItem>
                                <MenuItem value="income">הכנסה</MenuItem>
                            </TextField>
                        )}
                    />

                    {/* בחירת אייקון */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            אייקון
                        </Typography>
                        <Controller
                            name="icon"
                            control={control}
                            render={({ field }) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {commonIcons.map((icon) => (
                                        <IconButton
                                            key={icon}
                                            onClick={() => field.onChange(icon)}
                                            sx={{
                                                border: field.value === icon ? 2 : 1,
                                                borderColor: field.value === icon ? 'primary.main' : 'grey.300',
                                            }}
                                        >
                                            {icon}
                                        </IconButton>
                                    ))}
                                </Box>
                            )}
                        />
                    </Box>

                    {/* בחירת צבע */}
                    <Controller
                        name="color"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                type="color"
                                label="צבע"
                                sx={{ mb: 2 }}
                            />
                        )}
                    />

                    {/* תתי קטגוריות */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            תתי קטגוריות
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="הוסף תת-קטגוריה"
                                value={newSubcategory}
                                onChange={(e) => setNewSubcategory(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSubcategory();
                                    }
                                }}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddSubcategory}
                                disabled={!newSubcategory.trim()}
                            >
                                הוסף
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {subcategories.map((sub, index) => (
                                <Chip
                                    key={index}
                                    label={sub}
                                    onDelete={() => handleRemoveSubcategory(index)}
                                    deleteIcon={<Close />}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>ביטול</Button>
                <Button onClick={handleSubmit(onSubmit)} variant="contained">
                    שמור
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CategoryDialog;

