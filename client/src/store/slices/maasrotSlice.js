import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { maasrotService } from '../../services/maasrotService';

const initialState = {
    maasrot: {
        _id: null,
        monthlyIncome: 0,
        maasrotTarget: 0,
        totalDonated: 0,
        remaining: 0,
        donations: [],
        lastUpdated: null,
    },
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchMaasrot = createAsyncThunk(
    'maasrot/fetchMaasrot',
    async ({ month = null, year = null } = {}, { rejectWithValue }) => {
        try {
            const response = await maasrotService.getMaasrot(month, year);
            if (response.success) {
                return response.maasrot;
            } else {
                return rejectWithValue(response.message || 'שגיאה בטעינת נתוני המעשרות');
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת נתוני המעשרות');
        }
    }
);

export const addDonation = createAsyncThunk(
    'maasrot/addDonation',
    async (donationData, { rejectWithValue }) => {
        try {
            const response = await maasrotService.addDonation(donationData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בהוספת התרומה');
        }
    }
);

export const updateDonation = createAsyncThunk(
    'maasrot/updateDonation',
    async ({ donationId, donationData }, { rejectWithValue }) => {
        try {
            const response = await maasrotService.updateDonation(donationId, donationData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון התרומה');
        }
    }
);

export const deleteDonation = createAsyncThunk(
    'maasrot/deleteDonation',
    async (donationId, { rejectWithValue }) => {
        try {
            const response = await maasrotService.deleteDonation(donationId);
            return { donationId, ...response };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה במחיקת התרומה');
        }
    }
);

export const updateMonthlyIncome = createAsyncThunk(
    'maasrot/updateMonthlyIncome',
    async (monthlyIncome, { rejectWithValue }) => {
        try {
            const response = await maasrotService.updateMonthlyIncome(monthlyIncome);
            return response.maasrot;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון ההכנסה החודשית');
        }
    }
);

const maasrotSlice = createSlice({
    name: 'maasrot',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearMaasrot: (state) => {
            state.maasrot = initialState.maasrot;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch maasrot
            .addCase(fetchMaasrot.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMaasrot.fulfilled, (state, action) => {
                state.isLoading = false;
                state.maasrot = action.payload;
            })
            .addCase(fetchMaasrot.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Add donation
            .addCase(addDonation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addDonation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.maasrot = action.payload.maasrot;
            })
            .addCase(addDonation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Update donation
            .addCase(updateDonation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateDonation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.maasrot = action.payload.maasrot;
            })
            .addCase(updateDonation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Delete donation
            .addCase(deleteDonation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteDonation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.maasrot = action.payload.maasrot;
            })
            .addCase(deleteDonation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Update monthly income
            .addCase(updateMonthlyIncome.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateMonthlyIncome.fulfilled, (state, action) => {
                state.isLoading = false;
                state.maasrot = action.payload;
            })
            .addCase(updateMonthlyIncome.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, clearMaasrot } = maasrotSlice.actions;
export default maasrotSlice.reducer;
