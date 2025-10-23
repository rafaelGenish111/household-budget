import Maasrot from '../models/Maasrot.js';
import Transaction from '../models/Transaction.js';

// @desc    Get maasrot data for household
// @route   GET /api/maasrot
// @access  Private
export const getMaasrot = async (req, res) => {
    try {
        const household = req.user.household;
        const userId = req.user._id;

        // Calculate monthly income from transactions
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const incomeTransactions = await Transaction.find({
            household,
            type: 'income',
            date: {
                $gte: currentMonth,
                $lt: nextMonth
            }
        });

        const monthlyIncome = incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

        // Get or create maasrot record
        const maasrot = await Maasrot.getOrCreate(household, userId, monthlyIncome);

        res.json({
            success: true,
            maasrot: {
                _id: maasrot._id,
                monthlyIncome: maasrot.monthlyIncome,
                maasrotTarget: maasrot.maasrotTarget,
                totalDonated: maasrot.totalDonated,
                remaining: maasrot.remaining,
                donations: maasrot.donations.sort((a, b) => new Date(b.date) - new Date(a.date)),
                lastUpdated: maasrot.lastUpdated,
            }
        });
    } catch (error) {
        console.error('Error getting maasrot:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת נתוני המעשרות',
        });
    }
};

// @desc    Add donation to maasrot
// @route   POST /api/maasrot/donation
// @access  Private
export const addDonation = async (req, res) => {
    try {
        const { amount, date, description } = req.body;
        const household = req.user.household;
        const userId = req.user._id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין סכום תרומה תקין',
            });
        }

        // Get or create maasrot record
        const maasrot = await Maasrot.getOrCreate(household, userId, 0);

        // Add donation
        const donationData = {
            amount: Number(amount),
            date: date ? new Date(date) : new Date(),
            description: description || '',
        };

        await maasrot.addDonation(donationData);

        res.json({
            success: true,
            message: 'התרומה נוספה בהצלחה',
            donation: donationData,
            maasrot: {
                _id: maasrot._id,
                monthlyIncome: maasrot.monthlyIncome,
                maasrotTarget: maasrot.maasrotTarget,
                totalDonated: maasrot.totalDonated,
                remaining: maasrot.remaining,
            }
        });
    } catch (error) {
        console.error('Error adding donation:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בהוספת התרומה',
        });
    }
};

// @desc    Update donation
// @route   PUT /api/maasrot/donation/:donationId
// @access  Private
export const updateDonation = async (req, res) => {
    try {
        const { donationId } = req.params;
        const { amount, date, description } = req.body;
        const household = req.user.household;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין סכום תרומה תקין',
            });
        }

        const maasrot = await Maasrot.findOne({ household });
        if (!maasrot) {
            return res.status(404).json({
                success: false,
                message: 'נתוני מעשרות לא נמצאו',
            });
        }

        const donation = maasrot.donations.id(donationId);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'התרומה לא נמצאה',
            });
        }

        // Update donation
        donation.amount = Number(amount);
        donation.date = date ? new Date(date) : donation.date;
        donation.description = description || '';

        // Recalculate totals
        maasrot.totalDonated = maasrot.donations.reduce((sum, d) => sum + d.amount, 0);
        maasrot.remaining = maasrot.maasrotTarget - maasrot.totalDonated;
        maasrot.lastUpdated = new Date();

        await maasrot.save();

        res.json({
            success: true,
            message: 'התרומה עודכנה בהצלחה',
            maasrot: {
                _id: maasrot._id,
                monthlyIncome: maasrot.monthlyIncome,
                maasrotTarget: maasrot.maasrotTarget,
                totalDonated: maasrot.totalDonated,
                remaining: maasrot.remaining,
            }
        });
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בעדכון התרומה',
        });
    }
};

// @desc    Delete donation
// @route   DELETE /api/maasrot/donation/:donationId
// @access  Private
export const deleteDonation = async (req, res) => {
    try {
        const { donationId } = req.params;
        const household = req.user.household;

        const maasrot = await Maasrot.findOne({ household });
        if (!maasrot) {
            return res.status(404).json({
                success: false,
                message: 'נתוני מעשרות לא נמצאו',
            });
        }

        const donation = maasrot.donations.id(donationId);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'התרומה לא נמצאה',
            });
        }

        // Remove donation
        donation.deleteOne();

        // Recalculate totals
        maasrot.totalDonated = maasrot.donations.reduce((sum, d) => sum + d.amount, 0);
        maasrot.remaining = maasrot.maasrotTarget - maasrot.totalDonated;
        maasrot.lastUpdated = new Date();

        await maasrot.save();

        res.json({
            success: true,
            message: 'התרומה נמחקה בהצלחה',
            maasrot: {
                _id: maasrot._id,
                monthlyIncome: maasrot.monthlyIncome,
                maasrotTarget: maasrot.maasrotTarget,
                totalDonated: maasrot.totalDonated,
                remaining: maasrot.remaining,
            }
        });
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה במחיקת התרומה',
        });
    }
};

// @desc    Update monthly income and recalculate target
// @route   PUT /api/maasrot/income
// @access  Private
export const updateMonthlyIncome = async (req, res) => {
    try {
        const { monthlyIncome } = req.body;
        const household = req.user.household;
        const userId = req.user._id;

        if (!monthlyIncome || monthlyIncome < 0) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין הכנסה חודשית תקינה',
            });
        }

        const maasrot = await Maasrot.getOrCreate(household, userId, monthlyIncome);
        await maasrot.updateMonthlyIncome(monthlyIncome);

        res.json({
            success: true,
            message: 'ההכנסה החודשית עודכנה בהצלחה',
            maasrot: {
                _id: maasrot._id,
                monthlyIncome: maasrot.monthlyIncome,
                maasrotTarget: maasrot.maasrotTarget,
                totalDonated: maasrot.totalDonated,
                remaining: maasrot.remaining,
            }
        });
    } catch (error) {
        console.error('Error updating monthly income:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בעדכון ההכנסה החודשית',
        });
    }
};
