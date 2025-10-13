import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionService } from '../../services/transactionService';

const initialState = {
    transactions: [],
    summary: null,
    byCategory: [],
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    count: 0,
};

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            const response = await transactionService.getAll(params);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת תנועות');
        }
    }
);

export const fetchSummary = createAsyncThunk(
    'transactions/fetchSummary',
    async (params, { rejectWithValue }) => {
        try {
            const response = await transactionService.getSummary(params);
            return response.summary;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת סיכום');
        }
    }
);

export const fetchByCategory = createAsyncThunk(
    'transactions/fetchByCategory',
    async (params, { rejectWithValue }) => {
        try {
            const response = await transactionService.getByCategory(params);
            return response.byCategory;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת נתונים');
        }
    }
);

export const createTransaction = createAsyncThunk(
    'transactions/create',
    async (transactionData, { rejectWithValue }) => {
        try {
            const response = await transactionService.create(transactionData);
            return response.transaction;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה ביצירת תנועה');
        }
    }
);

export const updateTransaction = createAsyncThunk(
    'transactions/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await transactionService.update(id, data);
            return response.transaction;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון תנועה');
        }
    }
);

export const deleteTransaction = createAsyncThunk(
    'transactions/delete',
    async (id, { rejectWithValue }) => {
        try {
            await transactionService.delete(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה במחיקת תנועה');
        }
    }
);

const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch transactions
            .addCase(fetchTransactions.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.transactions = action.payload.transactions;
                state.currentPage = action.payload.currentPage;
                state.totalPages = action.payload.totalPages;
                state.count = action.payload.count;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch summary
            .addCase(fetchSummary.fulfilled, (state, action) => {
                state.summary = action.payload;
            })
            // Fetch by category
            .addCase(fetchByCategory.fulfilled, (state, action) => {
                state.byCategory = action.payload;
            })
            // Create transaction
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.transactions.unshift(action.payload);
                state.count += 1;
            })
            // Update transaction
            .addCase(updateTransaction.fulfilled, (state, action) => {
                const index = state.transactions.findIndex((t) => t._id === action.payload._id);
                if (index !== -1) {
                    state.transactions[index] = action.payload;
                }
            })
            // Delete transaction
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.transactions = state.transactions.filter((t) => t._id !== action.payload);
                state.count -= 1;
            });
    },
});

export const { clearError } = transactionsSlice.actions;
export default transactionsSlice.reducer;

