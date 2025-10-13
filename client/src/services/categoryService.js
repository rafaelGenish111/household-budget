import api from './api';

export const categoryService = {
    getAll: async (type = null) => {
        const params = type ? { type } : {};
        const response = await api.get('/categories', { params });
        return response.data;
    },

    create: async (categoryData) => {
        const response = await api.post('/categories', categoryData);
        return response.data;
    },

    update: async (id, categoryData) => {
        const response = await api.put(`/categories/${id}`, categoryData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
};

