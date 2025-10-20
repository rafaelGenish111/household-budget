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
        console.log('commitmentService.create called with:', commitmentData);
        const response = await api.post('/commitments', commitmentData);
        console.log('commitmentService.create response:', response);
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

    getUpcomingCharges: async (days = 7) => {
        const response = await api.get('/commitments/upcoming-charges', { params: { days } });
        return response.data;
    },
};

