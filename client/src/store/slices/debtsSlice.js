import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { debtService } from '../../services/debtService';

export const fetchDebts = createAsyncThunk('debts/fetchAll', async (filters, { rejectWithValue }) => {
    try {
        const response = await debtService.getAll(filters);
        return response.debts;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchDebt = createAsyncThunk('debts/fetchOne', async (id, { rejectWithValue }) => {
    try {
        const response = await debtService.getById(id);
        return response.debt;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const createDebt = createAsyncThunk('debts/create', async (debtData, { rejectWithValue }) => {
    try {
        const response = await debtService.create(debtData);
        return response.debt;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateDebt = createAsyncThunk('debts/update', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await debtService.update(id, data);
        return response.debt;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const deleteDebt = createAsyncThunk('debts/delete', async (id, { rejectWithValue }) => {
    try {
        await debtService.delete(id);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const addDebtPayment = createAsyncThunk('debts/addPayment', async ({ id, paymentData }, { rejectWithValue }) => {
    try {
        const response = await debtService.addPayment(id, paymentData);
        return response.debt;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchDebtsSummary = createAsyncThunk('debts/fetchSummary', async (_, { rejectWithValue }) => {
    try {
        const response = await debtService.getSummary();
        return response.summary;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchUpcomingDebts = createAsyncThunk('debts/fetchUpcoming', async (days, { rejectWithValue }) => {
    try {
        const response = await debtService.getUpcoming(days);
        return response.debts;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

const debtsSlice = createSlice({
    name: 'debts',
    initialState: {
        debts: [],
        currentDebt: null,
        summary: null,
        upcomingDebts: [],
        isLoading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => { state.error = null; },
        clearCurrentDebt: (state) => { state.currentDebt = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDebts.pending, (state) => { state.isLoading = true; })
            .addCase(fetchDebts.fulfilled, (state, action) => { state.isLoading = false; state.debts = action.payload; })
            .addCase(fetchDebts.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
            .addCase(fetchDebt.fulfilled, (state, action) => { state.currentDebt = action.payload; })
            .addCase(createDebt.fulfilled, (state, action) => { state.debts.push(action.payload); })
            .addCase(updateDebt.fulfilled, (state, action) => {
                const idx = state.debts.findIndex((d) => d._id === action.payload._id);
                if (idx !== -1) state.debts[idx] = action.payload;
                if (state.currentDebt?._id === action.payload._id) state.currentDebt = action.payload;
            })
            .addCase(deleteDebt.fulfilled, (state, action) => { state.debts = state.debts.filter((d) => d._id !== action.payload); })
            .addCase(addDebtPayment.fulfilled, (state, action) => {
                const idx = state.debts.findIndex((d) => d._id === action.payload._id);
                if (idx !== -1) state.debts[idx] = action.payload;
                if (state.currentDebt?._id === action.payload._id) state.currentDebt = action.payload;
            })
            .addCase(fetchDebtsSummary.fulfilled, (state, action) => { state.summary = action.payload; })
            .addCase(fetchUpcomingDebts.fulfilled, (state, action) => { state.upcomingDebts = action.payload; });
    }
});

export const { clearError, clearCurrentDebt } = debtsSlice.actions;
export default debtsSlice.reducer;


