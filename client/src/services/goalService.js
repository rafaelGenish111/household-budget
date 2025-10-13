import api from './api';

export const goalService = {
    getByMonth: async (month) => {
        const response = await api.get(`/goals/${month}`);
        return response.data;
    },

    createOrUpdate: async (goalData) => {
        const response = await api.post('/goals', goalData);
        return response.data;
    },

    getRemainingBudget: async (month, category) => {
        const response = await api.get(`/goals/${month}/remaining/${category}`);
        return response.data;
    },
};

