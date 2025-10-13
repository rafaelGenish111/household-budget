import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoryService } from '../../services/categoryService';

const initialState = {
    categories: [],
    isLoading: false,
    error: null,
};

export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (type = null, { rejectWithValue }) => {
        try {
            const response = await categoryService.getAll(type);
            return response.categories;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת קטגוריות');
        }
    }
);

export const createCategory = createAsyncThunk(
    'categories/create',
    async (categoryData, { rejectWithValue }) => {
        try {
            const response = await categoryService.create(categoryData);
            return response.category;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה ביצירת קטגוריה');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'categories/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await categoryService.update(id, data);
            return response.category;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון קטגוריה');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'categories/delete',
    async (id, { rejectWithValue }) => {
        try {
            await categoryService.delete(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'שגיאה במחיקת קטגוריה');
        }
    }
);

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.categories.push(action.payload);
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter((c) => c._id !== action.payload);
            });
    },
});

export const { clearError } = categoriesSlice.actions;
export default categoriesSlice.reducer;

