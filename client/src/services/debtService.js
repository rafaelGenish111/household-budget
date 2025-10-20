import api from './api.js';

export const debtService = {
    getAll: async (filters = {}) => {
        const response = await api.get('/debts', { params: filters });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/debts/${id}`);
        return response.data;
    },
    create: async (debtData) => {
        const response = await api.post('/debts', debtData);
        return response.data;
    },
    update: async (id, debtData) => {
        const response = await api.put(`/debts/${id}`, debtData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/debts/${id}`);
        return response.data;
    },
    addPayment: async (id, paymentData) => {
        const response = await api.post(`/debts/${id}/payment`, paymentData);
        return response.data;
    },
    getSummary: async () => {
        const response = await api.get('/debts/summary');
        return response.data;
    },
    getUpcoming: async (days = 30) => {
        const response = await api.get('/debts/upcoming', { params: { days } });
        return response.data;
    },
};


