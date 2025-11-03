import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * יוצר קובץ Excel לייצוא תנועות
 * @param {Array} transactions - רשימת תנועות
 * @param {Object} options - אפשרויות ייצוא
 * @returns {Promise<ExcelJS.Workbook>} - קובץ Excel
 */
export async function exportTransactions(transactions, options = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Household Budget App';
    workbook.created = new Date();

    // Sheet 1: Transactions List
    const transactionsSheet = workbook.addWorksheet('תנועות');
    
    // Set RTL direction
    transactionsSheet.views = [{ rightToLeft: true }];

    // Headers
    const headers = [
        'תאריך',
        'סוג',
        'קטגוריה',
        'תת-קטגוריה',
        'תיאור',
        'סכום',
        'אמצעי תשלום',
        'משתמש'
    ];

    // Add headers row
    const headerRow = transactionsSheet.addRow(headers);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    transactions.forEach(transaction => {
        const row = transactionsSheet.addRow([
            transaction.date ? format(new Date(transaction.date), 'dd/MM/yyyy', { locale: he }) : '',
            transaction.type === 'income' ? 'הכנסה' : 'הוצאה',
            transaction.category || '',
            transaction.subcategory || '',
            transaction.description || '',
            transaction.amount || 0,
            transaction.paymentMethod || '',
            transaction.user?.name || ''
        ]);

        // Color code by type
        if (transaction.type === 'income') {
            row.getCell(6).font = { color: { argb: 'FF4CAF50' } };
        } else {
            row.getCell(6).font = { color: { argb: 'FFF44336' } };
        }
    });

    // Format columns
    transactionsSheet.getColumn(1).width = 12; // Date
    transactionsSheet.getColumn(2).width = 10; // Type
    transactionsSheet.getColumn(3).width = 20; // Category
    transactionsSheet.getColumn(4).width = 20; // Subcategory
    transactionsSheet.getColumn(5).width = 30; // Description
    transactionsSheet.getColumn(6).width = 15; // Amount
    transactionsSheet.getColumn(6).numFmt = '#,##0.00 "₪"'; // Currency format
    transactionsSheet.getColumn(7).width = 15; // Payment Method
    transactionsSheet.getColumn(8).width = 15; // User

    // Sheet 2: Summary
    const summarySheet = workbook.addWorksheet('סיכום');
    summarySheet.views = [{ rightToLeft: true }];

    // Calculate summary
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const balance = income - expenses;

    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;

    // Add summary data
    summarySheet.addRow(['סוג', 'סכום', 'כמות']);
    summarySheet.addRow(['הכנסות', income, incomeCount]);
    summarySheet.addRow(['הוצאות', expenses, expenseCount]);
    summarySheet.addRow(['מאזן', balance, '']);

    // Format summary sheet
    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true };
    summaryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    summarySheet.getColumn(1).width = 15;
    summarySheet.getColumn(2).width = 20;
    summarySheet.getColumn(2).numFmt = '#,##0.00 "₪"';
    summarySheet.getColumn(3).width = 10;

    // Color code summary
    summarySheet.getRow(2).getCell(2).font = { color: { argb: 'FF4CAF50' } }; // Income - green
    summarySheet.getRow(3).getCell(2).font = { color: { argb: 'FFF44336' } }; // Expenses - red
    summarySheet.getRow(4).getCell(2).font = { bold: true };

    return workbook;
}

/**
 * יוצר דוח חודשי
 * @param {Object} data - נתונים חודשיים
 * @param {number} month - חודש (1-12)
 * @param {number} year - שנה
 * @returns {Promise<ExcelJS.Workbook>} - קובץ Excel
 */
export async function exportMonthlyReport(data, month, year) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Household Budget App';
    workbook.created = new Date();

    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const monthName = monthNames[month - 1];

    // Sheet 1: Monthly Transactions
    const transactionsSheet = workbook.addWorksheet('תנועות חודשיות');
    transactionsSheet.views = [{ rightToLeft: true }];

    const headers = ['תאריך', 'סוג', 'קטגוריה', 'תיאור', 'סכום', 'אמצעי תשלום'];
    const headerRow = transactionsSheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(transaction => {
            const row = transactionsSheet.addRow([
                transaction.date ? format(new Date(transaction.date), 'dd/MM/yyyy', { locale: he }) : '',
                transaction.type === 'income' ? 'הכנסה' : 'הוצאה',
                transaction.category || '',
                transaction.description || '',
                transaction.amount || 0,
                transaction.paymentMethod || ''
            ]);

            if (transaction.type === 'income') {
                row.getCell(5).font = { color: { argb: 'FF4CAF50' } };
            } else {
                row.getCell(5).font = { color: { argb: 'FFF44336' } };
            }
        });
    }

    transactionsSheet.getColumn(1).width = 12;
    transactionsSheet.getColumn(2).width = 10;
    transactionsSheet.getColumn(3).width = 20;
    transactionsSheet.getColumn(4).width = 30;
    transactionsSheet.getColumn(5).width = 15;
    transactionsSheet.getColumn(5).numFmt = '#,##0.00 "₪"';
    transactionsSheet.getColumn(6).width = 15;

    // Sheet 2: Summary by Category
    if (data.byCategory && data.byCategory.length > 0) {
        const categorySheet = workbook.addWorksheet('סיכום לפי קטגוריה');
        categorySheet.views = [{ rightToLeft: true }];

        const categoryHeaders = ['קטגוריה', 'סכום', 'אחוז'];
        const categoryHeaderRow = categorySheet.addRow(categoryHeaders);
        categoryHeaderRow.font = { bold: true };
        categoryHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const totalExpenses = data.byCategory.reduce((sum, cat) => sum + (cat.total || 0), 0);

        data.byCategory.forEach(category => {
            const percentage = totalExpenses > 0 ? ((category.total / totalExpenses) * 100).toFixed(1) : 0;
            categorySheet.addRow([
                category._id || category.category || '',
                category.total || 0,
                `${percentage}%`
            ]);
        });

        categorySheet.getColumn(1).width = 25;
        categorySheet.getColumn(2).width = 20;
        categorySheet.getColumn(2).numFmt = '#,##0.00 "₪"';
        categorySheet.getColumn(3).width = 10;
    }

    // Sheet 3: Summary Statistics
    const summarySheet = workbook.addWorksheet('סיכום כללי');
    summarySheet.views = [{ rightToLeft: true }];

    summarySheet.addRow(['דוח חודשי', `${monthName} ${year}`]);
    summarySheet.addRow([]);
    
    if (data.summary) {
        summarySheet.addRow(['סוג', 'סכום', 'כמות']);
        summarySheet.addRow(['הכנסות', data.summary.income || 0, data.summary.incomeCount || 0]);
        summarySheet.addRow(['הוצאות', data.summary.expense || 0, data.summary.expenseCount || 0]);
        summarySheet.addRow(['מאזן', (data.summary.income || 0) - (data.summary.expense || 0), '']);

        const summaryHeaderRow = summarySheet.getRow(3);
        summaryHeaderRow.font = { bold: true };
        summaryHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        summarySheet.getColumn(1).width = 15;
        summarySheet.getColumn(2).width = 20;
        summarySheet.getColumn(2).numFmt = '#,##0.00 "₪"';
        summarySheet.getColumn(3).width = 10;

        summarySheet.getRow(4).getCell(2).font = { color: { argb: 'FF4CAF50' } };
        summarySheet.getRow(5).getCell(2).font = { color: { argb: 'FFF44336' } };
        summarySheet.getRow(6).getCell(2).font = { bold: true };
    }

    return workbook;
}

/**
 * יוצר דוח שנתי
 * @param {Object} data - נתונים שנתיים
 * @param {number} year - שנה
 * @returns {Promise<ExcelJS.Workbook>} - קובץ Excel
 */
export async function exportYearlyReport(data, year) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Household Budget App';
    workbook.created = new Date();

    // Sheet 1: Monthly Summary
    const monthlySheet = workbook.addWorksheet('סיכום חודשי');
    monthlySheet.views = [{ rightToLeft: true }];

    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    
    const headers = ['חודש', 'הכנסות', 'הוצאות', 'מאזן'];
    const headerRow = monthlySheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    if (data.monthlySummary && data.monthlySummary.length > 0) {
        data.monthlySummary.forEach(month => {
            const balance = (month.income || 0) - (month.expenses || 0);
            monthlySheet.addRow([
                monthNames[month.month - 1] || `חודש ${month.month}`,
                month.income || 0,
                month.expenses || 0,
                balance
            ]);
        });
    }

    monthlySheet.getColumn(1).width = 15;
    monthlySheet.getColumn(2).width = 20;
    monthlySheet.getColumn(2).numFmt = '#,##0.00 "₪"';
    monthlySheet.getColumn(3).width = 20;
    monthlySheet.getColumn(3).numFmt = '#,##0.00 "₪"';
    monthlySheet.getColumn(4).width = 20;
    monthlySheet.getColumn(4).numFmt = '#,##0.00 "₪"';

    // Sheet 2: Yearly Transactions
    if (data.transactions && data.transactions.length > 0) {
        const transactionsSheet = workbook.addWorksheet('תנועות שנתיות');
        transactionsSheet.views = [{ rightToLeft: true }];

        const transHeaders = ['תאריך', 'סוג', 'קטגוריה', 'תיאור', 'סכום'];
        const transHeaderRow = transactionsSheet.addRow(transHeaders);
        transHeaderRow.font = { bold: true };
        transHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        data.transactions.forEach(transaction => {
            const row = transactionsSheet.addRow([
                transaction.date ? format(new Date(transaction.date), 'dd/MM/yyyy', { locale: he }) : '',
                transaction.type === 'income' ? 'הכנסה' : 'הוצאה',
                transaction.category || '',
                transaction.description || '',
                transaction.amount || 0
            ]);

            if (transaction.type === 'income') {
                row.getCell(5).font = { color: { argb: 'FF4CAF50' } };
            } else {
                row.getCell(5).font = { color: { argb: 'FFF44336' } };
            }
        });

        transactionsSheet.getColumn(1).width = 12;
        transactionsSheet.getColumn(2).width = 10;
        transactionsSheet.getColumn(3).width = 20;
        transactionsSheet.getColumn(4).width = 30;
        transactionsSheet.getColumn(5).width = 15;
        transactionsSheet.getColumn(5).numFmt = '#,##0.00 "₪"';
    }

    // Sheet 3: Yearly Summary
    const summarySheet = workbook.addWorksheet('סיכום שנתי');
    summarySheet.views = [{ rightToLeft: true }];

    summarySheet.addRow(['דוח שנתי', year]);
    summarySheet.addRow([]);

    if (data.summary) {
        summarySheet.addRow(['סוג', 'סכום', 'כמות']);
        summarySheet.addRow(['הכנסות', data.summary.income || 0, data.summary.incomeCount || 0]);
        summarySheet.addRow(['הוצאות', data.summary.expense || 0, data.summary.expenseCount || 0]);
        summarySheet.addRow(['מאזן', (data.summary.income || 0) - (data.summary.expense || 0), '']);

        const summaryHeaderRow = summarySheet.getRow(3);
        summaryHeaderRow.font = { bold: true };
        summaryHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        summarySheet.getColumn(1).width = 15;
        summarySheet.getColumn(2).width = 20;
        summarySheet.getColumn(2).numFmt = '#,##0.00 "₪"';
        summarySheet.getColumn(3).width = 10;

        summarySheet.getRow(4).getCell(2).font = { color: { argb: 'FF4CAF50' } };
        summarySheet.getRow(5).getCell(2).font = { color: { argb: 'FFF44336' } };
        summarySheet.getRow(6).getCell(2).font = { bold: true };
    }

    return workbook;
}

/**
 * יוצר דוח מעשרות
 * @param {Object} maasrotData - נתוני מעשרות
 * @param {number} month - חודש (1-12)
 * @param {number} year - שנה
 * @returns {Promise<ExcelJS.Workbook>} - קובץ Excel
 */
export async function exportMaasrot(maasrotData, month, year) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Household Budget App';
    workbook.created = new Date();

    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const monthName = monthNames[month - 1];

    // Sheet 1: Donations List
    const donationsSheet = workbook.addWorksheet('תרומות');
    donationsSheet.views = [{ rightToLeft: true }];

    const headers = ['תאריך', 'סכום', 'תיאור'];
    const headerRow = donationsSheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    if (maasrotData.donations && maasrotData.donations.length > 0) {
        maasrotData.donations.forEach(donation => {
            donationsSheet.addRow([
                donation.date ? format(new Date(donation.date), 'dd/MM/yyyy', { locale: he }) : '',
                donation.amount || 0,
                donation.description || ''
            ]);
        });
    }

    donationsSheet.getColumn(1).width = 15;
    donationsSheet.getColumn(2).width = 20;
    donationsSheet.getColumn(2).numFmt = '#,##0.00 "₪"';
    donationsSheet.getColumn(3).width = 40;

    // Sheet 2: Monthly Summary
    const summarySheet = workbook.addWorksheet('סיכום חודשי');
    summarySheet.views = [{ rightToLeft: true }];

    summarySheet.addRow(['דוח מעשרות', `${monthName} ${year}`]);
    summarySheet.addRow([]);
    summarySheet.addRow(['תיאור', 'סכום']);
    summarySheet.addRow(['הכנסה חודשית', maasrotData.monthlyIncome || 0]);
    summarySheet.addRow(['יעד מעשרות (10%)', maasrotData.maasrotTarget || 0]);
    summarySheet.addRow(['סך תרומות', maasrotData.totalDonated || 0]);
    summarySheet.addRow(['יתרה נותרת', maasrotData.remaining || 0]);

    const summaryHeaderRow = summarySheet.getRow(3);
    summaryHeaderRow.font = { bold: true };
    summaryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 20;
    summarySheet.getColumn(2).numFmt = '#,##0.00 "₪"';

    // Color code remaining amount
    const remainingRow = summarySheet.getRow(7);
    if (maasrotData.remaining <= 0) {
        remainingRow.getCell(2).font = { color: { argb: 'FF4CAF50' }, bold: true };
    } else {
        remainingRow.getCell(2).font = { color: { argb: 'FFF44336' }, bold: true };
    }

    return workbook;
}

