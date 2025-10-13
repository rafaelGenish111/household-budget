import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { savingService } from '../../services/savingService';

const initialState = {
    savings: [],
    isLoading: false,
    error: null,
};

export const fetchSavings = createAsyncThunk(
    'savings/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await savingService.getAll();
            return response.savings;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת חסכונות');
        }
    }
);

export const createSaving = createAsyncThunk(
    'savings/create',
    async (savingData, { rejectWithValue }) => {
        try {
            const response = await savingService.create(savingData);
            return response.saving;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה ביצירת חסכון');
        }
    }
);

export const updateSaving = createAsyncThunk(
    'savings/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await savingService.update(id, data);
            return response.saving;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון חסכון');
        }
    }
);

export const deleteSaving = createAsyncThunk(
    'savings/delete',
    async (id, { rejectWithValue }) => {
        try {
            await savingService.delete(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה במחיקת חסכון');
        }
    }
);

export const addContribution = createAsyncThunk(
    'savings/addContribution',
    async ({ id, amount }, { rejectWithValue }) => {
        try {
            const response = await savingService.addContribution(id, amount);
            return response.saving;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בהוספת תרומה');
        }
    }
);

const savingsSlice = createSlice({
    name: 'savings',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSavings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSavings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.savings = action.payload;
            })
            .addCase(fetchSavings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createSaving.fulfilled, (state, action) => {
                state.savings.unshift(action.payload);
            })
            .addCase(updateSaving.fulfilled, (state, action) => {
                const index = state.savings.findIndex((s) => s._id === action.payload._id);
                if (index !== -1) {
                    state.savings[index] = action.payload;
                }
            })
            .addCase(deleteSaving.fulfilled, (state, action) => {
                state.savings = state.savings.filter((s) => s._id !== action.payload);
            })
            .addCase(addContribution.fulfilled, (state, action) => {
                const index = state.savings.findIndex((s) => s._id === action.payload._id);
                if (index !== -1) {
                    state.savings[index] = action.payload;
                }
            });
    },
});

export const { clearError } = savingsSlice.actions;
export default savingsSlice.reducer;

