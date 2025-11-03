import Transaction from '../models/Transaction.js';
import Maasrot from '../models/Maasrot.js';
import {
    exportTransactions,
    exportMonthlyReport,
    exportYearlyReport,
    exportMaasrot
} from '../services/exportService.js';
import { getTransactionSummary, getTransactionsByCategory } from './transactionController.js';

/**
 * ייצוא תנועות לאקסל
 * @route GET /api/exports/transactions
 */
export const exportTransactionsToExcel = async (req, res) => {
    try {
        const { type, category, startDate, endDate, search } = req.query;
        const household = req.user.household;

        // Build query (same as getTransactions but without pagination)
        const query = { household };

        if (type) query.type = type;
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }

        // Get all transactions (no pagination for export)
        const transactions = await Transaction.find(query)
            .populate('user', 'name')
            .sort({ date: -1 });

        // Generate Excel file
        const workbook = await exportTransactions(transactions, { type, category });

        // Set response headers
        const filename = `תנועות_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting transactions:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בייצוא התנועות',
        });
    }
};

/**
 * ייצוא דוח חודשי לאקסל
 * @route GET /api/exports/monthly
 */
export const exportMonthlyReportToExcel = async (req, res) => {
    try {
        const { month, year } = req.query;
        const household = req.user.household;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין חודש ושנה',
            });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Calculate date range for the month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        // Get transactions for the month
        const transactions = await Transaction.find({
            household,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .populate('user', 'name')
            .sort({ date: -1 });

        // Get summary
        const summary = await Transaction.aggregate([
            {
                $match: {
                    household: household,
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const income = summary.find((s) => s._id === 'income') || { total: 0, count: 0 };
        const expense = summary.find((s) => s._id === 'expense') || { total: 0, count: 0 };

        const summaryData = {
            income: income.total,
            incomeCount: income.count,
            expense: expense.total,
            expenseCount: expense.count,
            balance: income.total - expense.total,
        };

        // Get by category
        const byCategory = await Transaction.aggregate([
            {
                $match: {
                    household: household,
                    type: 'expense',
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { total: -1 }
            }
        ]);

        const data = {
            transactions,
            summary: summaryData,
            byCategory
        };

        // Generate Excel file
        const workbook = await exportMonthlyReport(data, monthNum, yearNum);

        // Set response headers
        const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        const monthName = monthNames[monthNum - 1];
        const filename = `דוח_חודשי_${monthName}_${yearNum}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בייצוא הדוח החודשי',
        });
    }
};

/**
 * ייצוא דוח שנתי לאקסל
 * @route GET /api/exports/yearly
 */
export const exportYearlyReportToExcel = async (req, res) => {
    try {
        const { year } = req.query;
        const household = req.user.household;

        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין שנה',
            });
        }

        const yearNum = parseInt(year);

        // Calculate date range for the year
        const startDate = new Date(yearNum, 0, 1);
        const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

        // Get all transactions for the year
        const transactions = await Transaction.find({
            household,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .populate('user', 'name')
            .sort({ date: -1 });

        // Get monthly summary
        const monthlySummary = await Transaction.aggregate([
            {
                $match: {
                    household: household,
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        type: '$type'
                    },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Organize monthly data
        const monthlyData = [];
        for (let m = 1; m <= 12; m++) {
            const monthIncome = monthlySummary.find(s => s._id.month === m && s._id.type === 'income')?.total || 0;
            const monthExpenses = monthlySummary.find(s => s._id.month === m && s._id.type === 'expense')?.total || 0;
            monthlyData.push({
                month: m,
                income: monthIncome,
                expenses: monthExpenses
            });
        }

        // Get yearly summary
        const summary = await Transaction.aggregate([
            {
                $match: {
                    household: household,
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const income = summary.find((s) => s._id === 'income') || { total: 0, count: 0 };
        const expense = summary.find((s) => s._id === 'expense') || { total: 0, count: 0 };

        const summaryData = {
            income: income.total,
            incomeCount: income.count,
            expense: expense.total,
            expenseCount: expense.count,
            balance: income.total - expense.total,
        };

        const data = {
            transactions,
            monthlySummary: monthlyData,
            summary: summaryData
        };

        // Generate Excel file
        const workbook = await exportYearlyReport(data, yearNum);

        // Set response headers
        const filename = `דוח_שנתי_${yearNum}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting yearly report:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בייצוא הדוח השנתי',
        });
    }
};

/**
 * ייצוא מעשרות לאקסל
 * @route GET /api/exports/maasrot
 */
export const exportMaasrotToExcel = async (req, res) => {
    try {
        const { month, year } = req.query;
        const household = req.user.household;
        const userId = req.user._id;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין חודש ושנה',
            });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Calculate monthly income for the specified month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        const incomeTransactions = await Transaction.find({
            household,
            type: 'income',
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });

        const monthlyIncome = incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

        // Get maasrot record
        const maasrot = await Maasrot.getOrCreate(household, userId, monthlyIncome);

        // Filter donations by month
        const startOfMonth = new Date(yearNum, monthNum - 1, 1);
        const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59);

        const filteredDonations = maasrot.donations.filter(donation => {
            const donationDate = new Date(donation.date);
            return donationDate >= startOfMonth && donationDate <= endOfMonth;
        });

        const totalDonatedForMonth = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
        const maasrotTargetForMonth = Math.round(monthlyIncome * 0.1);
        const remainingForMonth = maasrotTargetForMonth - totalDonatedForMonth;

        const maasrotData = {
            monthlyIncome,
            maasrotTarget: maasrotTargetForMonth,
            totalDonated: totalDonatedForMonth,
            remaining: remainingForMonth,
            donations: filteredDonations
        };

        // Generate Excel file
        const workbook = await exportMaasrot(maasrotData, monthNum, yearNum);

        // Set response headers
        const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        const monthName = monthNames[monthNum - 1];
        const filename = `מעשרות_${monthName}_${yearNum}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting maasrot:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בייצוא המעשרות',
        });
    }
};

