import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import {
    fetchTransactions,
    fetchSummary,
    fetchByCategory,
    createTransaction,
    updateTransaction,
    deleteTransaction
} from '../store/slices/transactionsSlice';

export const useTransactions = () => {
    const dispatch = useDispatch();
    const {
        transactions,
        summary,
        byCategory,
        isLoading,
        error
    } = useSelector((state) => state.transactions);

    const loadTransactions = (filters = {}) => {
        dispatch(fetchTransactions(filters));
    };

    const loadSummary = (filters = {}) => {
        dispatch(fetchSummary(filters));
    };

    const loadByCategory = (filters = {}) => {
        dispatch(fetchByCategory(filters));
    };

    const addTransaction = async (transactionData) => {
        try {
            await dispatch(createTransaction(transactionData));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'שגיאה בהוספת תנועה'
            };
        }
    };

    const editTransaction = async (id, transactionData) => {
        try {
            await dispatch(updateTransaction({ id, data: transactionData }));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'שגיאה בעריכת תנועה'
            };
        }
    };

    const removeTransaction = async (id) => {
        try {
            await dispatch(deleteTransaction(id));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'שגיאה במחיקת תנועה'
            };
        }
    };

    // Auto-load current month data on mount
    useEffect(() => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        loadTransactions({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        loadSummary({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        loadByCategory({
            type: 'expense',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
    }, []);

    return {
        transactions,
        summary,
        byCategory,
        isLoading,
        error,
        loadTransactions,
        loadSummary,
        loadByCategory,
        addTransaction,
        editTransaction,
        removeTransaction
    };
};
