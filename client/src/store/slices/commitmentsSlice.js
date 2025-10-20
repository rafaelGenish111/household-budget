import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { commitmentService } from '../../services/commitmentService';

const initialState = {
    commitments: [],
    totals: {
        totalMonthlyPayment: 0,
        totalCommitments: 0,
        activeCommitments: 0,
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
            console.log('createCommitment thunk called with:', commitmentData);
            const response = await commitmentService.create(commitmentData);
            console.log('createCommitment response:', response);
            return response.commitment;
        } catch (error) {
            console.error('createCommitment error:', error);
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

// removed recordPayment – model now handles auto-charges only

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
                if (action.payload.isActive) {
                    state.totals.totalMonthlyPayment += action.payload.monthlyPayment;
                    state.totals.activeCommitments += 1;
                }
                state.totals.totalCommitments += 1;
            })
            .addCase(updateCommitment.fulfilled, (state, action) => {
                const index = state.commitments.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) {
                    state.commitments[index] = action.payload;
                }
            })
            .addCase(deleteCommitment.fulfilled, (state, action) => {
                const deleted = state.commitments.find((c) => c._id === action.payload);
                if (deleted) {
                    if (deleted.isActive) {
                        state.totals.totalMonthlyPayment -= deleted.monthlyPayment;
                        state.totals.activeCommitments -= 1;
                    }
                    state.totals.totalCommitments -= 1;
                }
                state.commitments = state.commitments.filter((c) => c._id !== action.payload);
            });
    },
});

export const { clearError } = commitmentsSlice.actions;
export default commitmentsSlice.reducer;

