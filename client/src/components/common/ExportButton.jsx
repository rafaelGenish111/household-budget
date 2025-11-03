import { useState } from 'react';
import { Button, Menu, MenuItem, CircularProgress, Alert } from '@mui/material';
import { FileDownload, ArrowDropDown } from '@mui/icons-material';
import {
    exportTransactions,
    exportMonthlyReport,
    exportYearlyReport,
    exportMaasrot
} from '../../services/exportService';

const ExportButton = ({ 
    exportType, 
    filters = {}, 
    month = null, 
    year = null,
    label = 'ייצא לאקסל',
    variant = 'outlined',
    color = 'primary'
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    const handleClick = (event) => {
        if (exportType === 'transactions' && filters.type) {
            // If specific type, show menu with options
            setAnchorEl(event.currentTarget);
        } else {
            // Direct export
            handleExport();
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleExport = async (specificType = null) => {
        setIsExporting(true);
        setError(null);
        handleClose();

        try {
            const exportFilters = specificType ? { ...filters, type: specificType } : filters;
            
            switch (exportType) {
                case 'transactions':
                    await exportTransactions(exportFilters);
                    break;
                case 'monthly':
                    if (!month || !year) {
                        throw new Error('נא לבחור חודש ושנה');
                    }
                    await exportMonthlyReport(month, year);
                    break;
                case 'yearly':
                    if (!year) {
                        throw new Error('נא לבחור שנה');
                    }
                    await exportYearlyReport(year);
                    break;
                case 'maasrot':
                    if (!month || !year) {
                        throw new Error('נא לבחור חודש ושנה');
                    }
                    await exportMaasrot(month, year);
                    break;
                default:
                    throw new Error('סוג ייצוא לא נתמך');
            }
        } catch (err) {
            console.error('Export error:', err);
            setError(err.response?.data?.message || err.message || 'שגיאה בייצוא הקובץ');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <Button
                variant={variant}
                color={color}
                startIcon={isExporting ? <CircularProgress size={16} /> : <FileDownload />}
                endIcon={exportType === 'transactions' && filters.type ? <ArrowDropDown /> : null}
                onClick={handleClick}
                disabled={isExporting}
            >
                {isExporting ? 'מייצא...' : label}
            </Button>

            {exportType === 'transactions' && filters.type && (
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={() => handleExport('expense')}>
                        ייצא הוצאות
                    </MenuItem>
                    <MenuItem onClick={() => handleExport('income')}>
                        ייצא הכנסות
                    </MenuItem>
                    <MenuItem onClick={() => handleExport(null)}>
                        ייצא הכל
                    </MenuItem>
                </Menu>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}
        </>
    );
};

export default ExportButton;

