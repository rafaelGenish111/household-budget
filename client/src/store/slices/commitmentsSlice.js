import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { commitmentService } from '../../services/commitmentService';

const initialState = {
    commitments: [],
    totals: {
        totalDebt: 0,
        totalMonthlyPayment: 0,
        totalCommitments: 0,
    },
    isLoading: false,
    error: null,
};

export const fetchCommitments = createAsyncThunk(
    'commitments/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await commitmentService.getAll();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת התחייבויות');
        }
    }
);

export const createCommitment = createAsyncThunk(
    'commitments/create',
    async (commitmentData, { rejectWithValue }) => {
        try {
            const response = await commitmentService.create(commitmentData);
            return response.commitment;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה ביצירת התחייבות');
        }
    }
);

export const updateCommitment = createAsyncThunk(
    'commitments/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await commitmentService.update(id, data);
            return response.commitment;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון התחייבות');
        }
    }
);

export const deleteCommitment = createAsyncThunk(
    'commitments/delete',
    async (id, { rejectWithValue }) => {
        try {
            await commitmentService.delete(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה במחיקת התחייבות');
        }
    }
);

export const recordPayment = createAsyncThunk(
    'commitments/recordPayment',
    async ({ id, amount }, { rejectWithValue }) => {
        try {
            const response = await commitmentService.recordPayment(id, amount);
            return response.commitment;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בתשלום');
        }
    }
);

const commitmentsSlice = createSlice({
    name: 'commitments',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCommitments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCommitments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.commitments = action.payload.commitments;
                state.totals = action.payload.totals;
            })
            .addCase(fetchCommitments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createCommitment.fulfilled, (state, action) => {
                state.commitments.unshift(action.payload);
            })
            .addCase(updateCommitment.fulfilled, (state, action) => {
                const index = state.commitments.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) {
                    state.commitments[index] = action.payload;
                }
            })
            .addCase(deleteCommitment.fulfilled, (state, action) => {
                state.commitments = state.commitments.filter((c) => c._id !== action.payload);
            })
            .addCase(recordPayment.fulfilled, (state, action) => {
                const index = state.commitments.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) {
                    state.commitments[index] = action.payload;
                }
            });
    },
});

export const { clearError } = commitmentsSlice.actions;
export default commitmentsSlice.reducer;

