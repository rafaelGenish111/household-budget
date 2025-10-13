import api from './api';

export const aiService = {
    getRecommendations: async (month = null) => {
        const params = month ? { month } : {};
        const response = await api.get('/ai/recommendations', { params });
        return response.data;
    },
};

