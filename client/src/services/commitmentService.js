import api from './api';

export const commitmentService = {
    getAll: async () => {
        const response = await api.get('/commitments');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/commitments/${id}`);
        return response.data;
    },

    create: async (commitmentData) => {
        const response = await api.post('/commitments', commitmentData);
        return response.data;
    },

    update: async (id, commitmentData) => {
        const response = await api.put(`/commitments/${id}`, commitmentData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/commitments/${id}`);
        return response.data;
    },

    recordPayment: async (id, amount) => {
        const response = await api.post(`/commitments/${id}/payment`, { amount });
        return response.data;
    },
};

