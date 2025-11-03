import { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Typography,
    TextField,
    MenuItem,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
} from '@mui/icons-material';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

const MonthSelector = ({ value, onChange, label = 'חודש' }) => {
    const [selectedMonth, setSelectedMonth] = useState(value || new Date());
    
    // Sync with external value prop
    useEffect(() => {
        if (value) {
            setSelectedMonth(value);
        }
    }, [value]);

    const handlePreviousMonth = () => {
        const newMonth = subMonths(selectedMonth, 1);
        setSelectedMonth(newMonth);
        onChange(newMonth);
    };

    const handleNextMonth = () => {
        const newMonth = addMonths(selectedMonth, 1);
        setSelectedMonth(newMonth);
        onChange(newMonth);
    };

    const handleMonthChange = (event) => {
        const monthYear = event.target.value; // Format: "YYYY-MM"
        if (monthYear) {
            const [year, month] = monthYear.split('-');
            const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            setSelectedMonth(newDate);
            onChange(newDate);
        }
    };

    // Check if we can go to next month (not future months)
    const canGoNext = format(addMonths(selectedMonth, 1), 'yyyy-MM') <= format(new Date(), 'yyyy-MM');

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            sx={{ direction: 'rtl' }}
        >
            <IconButton
                onClick={handlePreviousMonth}
                size="small"
                sx={{ ml: 1 }}
            >
                <ChevronRight />
            </IconButton>

            <Box display="flex" alignItems="center" gap={1} flex={1}>
                <TextField
                    type="month"
                    value={format(selectedMonth, 'yyyy-MM')}
                    onChange={handleMonthChange}
                    label={label}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{
                        flex: 1,
                        '& .MuiInputBase-input': {
                            textAlign: 'center',
                        },
                    }}
                />
                <Typography variant="body1" sx={{ minWidth: '100px', textAlign: 'center' }}>
                    {format(selectedMonth, 'MMMM yyyy', { locale: he })}
                </Typography>
            </Box>

            <IconButton
                onClick={handleNextMonth}
                disabled={!canGoNext}
                size="small"
                sx={{ mr: 1 }}
            >
                <ChevronLeft />
            </IconButton>
        </Box>
    );
};

export default MonthSelector;

