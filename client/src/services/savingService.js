import api from './api';

export const savingService = {
    getAll: async () => {
        const response = await api.get('/savings');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/savings/${id}`);
        return response.data;
    },

    create: async (savingData) => {
        const response = await api.post('/savings', savingData);
        return response.data;
    },

    update: async (id, savingData) => {
        const response = await api.put(`/savings/${id}`, savingData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/savings/${id}`);
        return response.data;
    },

    addContribution: async (id, amount) => {
        const response = await api.post(`/savings/${id}/contribute`, { amount });
        return response.data;
    },
};

