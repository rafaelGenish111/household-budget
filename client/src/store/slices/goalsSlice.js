import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { goalService } from '../../services/goalService';

const initialState = {
    currentGoal: null,
    isLoading: false,
    error: null,
};

export const fetchGoal = createAsyncThunk(
    'goals/fetchByMonth',
    async (month, { rejectWithValue }) => {
        try {
            const response = await goalService.getByMonth(month);
            return response.goal;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת יעדים');
        }
    }
);

export const saveGoal = createAsyncThunk(
    'goals/save',
    async (goalData, { rejectWithValue }) => {
        try {
            const response = await goalService.createOrUpdate(goalData);
            return response.goal;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בשמירת יעדים');
        }
    }
);

const goalsSlice = createSlice({
    name: 'goals',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGoal.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchGoal.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentGoal = action.payload;
            })
            .addCase(fetchGoal.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(saveGoal.fulfilled, (state, action) => {
                state.currentGoal = action.payload;
            });
    },
});

export const { clearError } = goalsSlice.actions;
export default goalsSlice.reducer;

