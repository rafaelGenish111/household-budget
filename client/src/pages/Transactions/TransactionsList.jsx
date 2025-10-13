import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    TextField,
    MenuItem,
    Grid,
    Chip,
    TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
    fetchTransactions,
    deleteTransaction,
} from '../../store/slices/transactionsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddTransactionDialog from './AddTransactionDialog';

const TransactionsList = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { transactions, isLoading, currentPage, totalPages, count } = useSelector(
        (state) => state.transactions
    );
    const { categories } = useSelector((state) => state.categories);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTransaction, setEditTransaction] = useState(null);
    const [filters, setFilters] = useState({
        type: searchParams.get('type') || '',
        category: '',
        search: '',
        page: 1,
        limit: 25,
    });

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchTransactions(filters));
    }, [dispatch, filters]);

    useEffect(() => {
        // Open dialog if "new=true" in URL
        if (searchParams.get('new') === 'true') {
            const type = searchParams.get('type') || 'expense';
            setEditTransaction({ type });
            setDialogOpen(true);
            // Remove query params
            setSearchParams({});
        }
    }, [searchParams, setSearchParams]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
    };

    const handlePageChange = (event, newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage + 1 }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את התנועה?')) {
            await dispatch(deleteTransaction(id));
            dispatch(fetchTransactions(filters));
        }
    };

    const handleEdit = (transaction) => {
        setEditTransaction(transaction);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditTransaction(null);
        dispatch(fetchTransactions(filters));
    };

    if (isLoading && transactions.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        תנועות
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        סה"כ {count} תנועות
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setEditTransaction(null);
                        setDialogOpen(true);
                    }}
                >
                    הוסף תנועה
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="סוג"
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <MenuItem value="">הכל</MenuItem>
                            <MenuItem value="income">הכנסות</MenuItem>
                            <MenuItem value="expense">הוצאות</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="קטגוריה"
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <MenuItem value="">הכל</MenuItem>
                            {categories
                                .filter((cat) => !filters.type || cat.type === filters.type)
                                .map((cat) => (
                                    <MenuItem key={cat._id} value={cat.name}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <TextField
                            fullWidth
                            label="חיפוש"
                            placeholder="חפש לפי תיאור או קטגוריה..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>תאריך</TableCell>
                            <TableCell>סוג</TableCell>
                            <TableCell>קטגוריה</TableCell>
                            <TableCell>תיאור</TableCell>
                            <TableCell>אמצעי תשלום</TableCell>
                            <TableCell align="left">סכום</TableCell>
                            <TableCell align="center">פעולות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="text.secondary" py={4}>
                                        אין תנועות להצגה
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((transaction) => (
                                <TableRow key={transaction._id} hover>
                                    <TableCell>
                                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: he })}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}
                                            color={transaction.type === 'income' ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{transaction.category}</TableCell>
                                    <TableCell>{transaction.description || '-'}</TableCell>
                                    <TableCell>{transaction.paymentMethod}</TableCell>
                                    <TableCell align="left">
                                        <Typography
                                            fontWeight="bold"
                                            color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                                        >
                                            {transaction.type === 'income' ? '+' : '-'}₪
                                            {transaction.amount.toLocaleString()}
                                        </Typography>
                                        {transaction.installments > 1 && (
                                            <Typography variant="caption" color="text.secondary">
                                                {transaction.installments} תשלומים
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => handleEdit(transaction)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(transaction._id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={count}
                    page={filters.page - 1}
                    onPageChange={handlePageChange}
                    rowsPerPage={filters.limit}
                    rowsPerPageOptions={[25]}
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
                />
            </TableContainer>

            <AddTransactionDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                transaction={editTransaction}
            />
        </Box>
    );
};

export default TransactionsList;

