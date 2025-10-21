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
        clearCategories: (state) => {
            state.categories = [];
        },
        removeDuplicates: (state) => {
            const uniqueCategories = state.categories.reduce((acc, category) => {
                if (!acc.find(cat => cat.name === category.name)) {
                    acc.push(category);
                }
                return acc;
            }, []);
            state.categories = uniqueCategories;
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
                // Remove duplicates by name (keep the first occurrence)
                const uniqueCategories = action.payload.reduce((acc, category) => {
                    if (!acc.find(cat => cat.name === category.name)) {
                        acc.push(category);
                    }
                    return acc;
                }, []);
                state.categories = uniqueCategories;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                // Check if category already exists (by name)
                if (!state.categories.find(cat => cat.name === action.payload.name)) {
                    state.categories.push(action.payload);
                }
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
                // Also check for duplicates after update
                const uniqueCategories = state.categories.reduce((acc, category) => {
                    if (!acc.find(cat => cat.name === category.name)) {
                        acc.push(category);
                    }
                    return acc;
                }, []);
                state.categories = uniqueCategories;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter((c) => c._id !== action.payload);
                // Also check for duplicates after delete
                const uniqueCategories = state.categories.reduce((acc, category) => {
                    if (!acc.find(cat => cat.name === category.name)) {
                        acc.push(category);
                    }
                    return acc;
                }, []);
                state.categories = uniqueCategories;
            });
    },
});

export const { clearError, clearCategories, removeDuplicates } = categoriesSlice.actions;
export default categoriesSlice.reducer;

