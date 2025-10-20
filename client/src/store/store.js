import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import transactionsReducer from './slices/transactionsSlice';
import savingsReducer from './slices/savingsSlice';
import commitmentsReducer from './slices/commitmentsSlice';
import goalsReducer from './slices/goalsSlice';
import categoriesReducer from './slices/categoriesSlice';
import themeReducer from './slices/themeSlice';
import debtsReducer from './slices/debtsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        transactions: transactionsReducer,
        savings: savingsReducer,
        commitments: commitmentsReducer,
        goals: goalsReducer,
        categories: categoriesReducer,
        theme: themeReducer,
        debts: debtsReducer,
    },
});

