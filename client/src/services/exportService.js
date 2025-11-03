import api from './api';
import { saveAs } from 'file-saver';

/**
 * ייצוא תנועות לאקסל
 * @param {Object} filters - פילטרים (type, category, startDate, endDate, search)
 */
export const exportTransactions = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        
        if (filters.type) params.append('type', filters.type);
        if (filters.category) params.append('category', filters.category);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);

        const response = await api.get(`/exports/transactions?${params.toString()}`, {
            responseType: 'blob',
        });

        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'תנועות.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }

        // Save file
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, filename);

        return { success: true };
    } catch (error) {
        console.error('Error exporting transactions:', error);
        throw error;
    }
};

/**
 * ייצוא דוח חודשי לאקסל
 * @param {number} month - חודש (1-12)
 * @param {number} year - שנה
 */
export const exportMonthlyReport = async (month, year) => {
    try {
        const response = await api.get(`/exports/monthly?month=${month}&year=${year}`, {
            responseType: 'blob',
        });

        const contentDisposition = response.headers['content-disposition'];
        let filename = `דוח_חודשי_${month}_${year}.xlsx`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, filename);

        return { success: true };
    } catch (error) {
        console.error('Error exporting monthly report:', error);
        throw error;
    }
};

/**
 * ייצוא דוח שנתי לאקסל
 * @param {number} year - שנה
 */
export const exportYearlyReport = async (year) => {
    try {
        const response = await api.get(`/exports/yearly?year=${year}`, {
            responseType: 'blob',
        });

        const contentDisposition = response.headers['content-disposition'];
        let filename = `דוח_שנתי_${year}.xlsx`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, filename);

        return { success: true };
    } catch (error) {
        console.error('Error exporting yearly report:', error);
        throw error;
    }
};

/**
 * ייצוא מעשרות לאקסל
 * @param {number} month - חודש (1-12)
 * @param {number} year - שנה
 */
export const exportMaasrot = async (month, year) => {
    try {
        const response = await api.get(`/exports/maasrot?month=${month}&year=${year}`, {
            responseType: 'blob',
        });

        const contentDisposition = response.headers['content-disposition'];
        let filename = `מעשרות_${month}_${year}.xlsx`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, filename);

        return { success: true };
    } catch (error) {
        console.error('Error exporting maasrot:', error);
        throw error;
    }
};

