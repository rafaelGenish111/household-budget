import api from './api.js';

// Get statistics for time range
export const getTimeRangeStats = async (startDate, endDate) => {
    try {
        const response = await api.get('/statistics/range', {
            params: { startDate, endDate }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching time range stats:', error);
        throw error;
    }
};

// Get category breakdown
export const getCategoryBreakdown = async (startDate, endDate, type = null) => {
    try {
        const params = { startDate, endDate };
        if (type) params.type = type;

        const response = await api.get('/statistics/categories', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching category breakdown:', error);
        throw error;
    }
};

// Get trend data
export const getTrendData = async (startDate, endDate, groupBy = 'day') => {
    try {
        const response = await api.get('/statistics/trends', {
            params: { startDate, endDate, groupBy }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching trend data:', error);
        throw error;
    }
};

// Get comparison between periods
export const getComparison = async (currentStart, currentEnd, previousStart, previousEnd) => {
    try {
        const response = await api.get('/statistics/comparison', {
            params: { currentStart, currentEnd, previousStart, previousEnd }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching comparison data:', error);
        throw error;
    }
};

// Helper function to calculate previous period dates
export const getPreviousPeriodDates = (startDate, endDate, range) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end.getTime() - start.getTime();

    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return {
        previousStart: previousStart.toISOString().split('T')[0],
        previousEnd: previousEnd.toISOString().split('T')[0]
    };
};

// Helper function to format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper function to format percentage
export const formatPercentage = (value) => {
    if (value === 0) return '0%';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
};

// Helper function to get change direction
export const getChangeDirection = (value) => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'neutral';
};

// Helper function to get change color
export const getChangeColor = (value, isExpense = false) => {
    if (value === 0) return 'text.secondary';
    if (isExpense) {
        return value > 0 ? 'error.main' : 'success.main';
    }
    return value > 0 ? 'success.main' : 'error.main';
};
