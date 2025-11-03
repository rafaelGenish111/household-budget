import api from './api';

export const maasrotService = {
    // Get maasrot data for household
    getMaasrot: async (month = null, year = null) => {
        const params = {};
        if (month !== null && year !== null) {
            params.month = month;
            params.year = year;
        }
        const response = await api.get('/maasrot', { params });
        return response.data;
    },

    // Add donation
    addDonation: async (donationData) => {
        const response = await api.post('/maasrot/donation', donationData);
        return response.data;
    },

    // Update donation
    updateDonation: async (donationId, donationData) => {
        const response = await api.put(`/maasrot/donation/${donationId}`, donationData);
        return response.data;
    },

    // Delete donation
    deleteDonation: async (donationId) => {
        const response = await api.delete(`/maasrot/donation/${donationId}`);
        return response.data;
    },

    // Update monthly income
    updateMonthlyIncome: async (monthlyIncome) => {
        const response = await api.put('/maasrot/income', { monthlyIncome });
        return response.data;
    },
};
