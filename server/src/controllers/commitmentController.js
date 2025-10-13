import Commitment from '../models/Commitment.js';

// @desc    Get all commitments
// @route   GET /api/commitments
// @access  Private
export const getCommitments = async (req, res) => {
    try {
        const commitments = await Commitment.find({ household: req.user.household }).sort({
            createdAt: -1,
        });

        // Calculate totals
        const totals = {
            totalDebt: 0,
            totalMonthlyPayment: 0,
            totalCommitments: commitments.length,
        };

        commitments.forEach((commitment) => {
            totals.totalDebt += commitment.remaining;
            totals.totalMonthlyPayment += commitment.monthlyPayment;
        });

        res.json({
            success: true,
            count: commitments.length,
            totals,
            commitments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single commitment
// @route   GET /api/commitments/:id
// @access  Private
export const getCommitment = async (req, res) => {
    try {
        const commitment = await Commitment.findById(req.params.id);

        if (!commitment) {
            return res.status(404).json({
                success: false,
                message: 'התחייבות לא נמצאה',
            });
        }

        // Check if commitment belongs to user's household
        if (commitment.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לצפות בהתחייבות זו',
            });
        }

        res.json({
            success: true,
            commitment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create commitment
// @route   POST /api/commitments
// @access  Private
export const createCommitment = async (req, res) => {
    try {
        const commitmentData = {
            ...req.body,
            household: req.user.household,
        };

        const commitment = await Commitment.create(commitmentData);

        res.status(201).json({
            success: true,
            commitment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update commitment
// @route   PUT /api/commitments/:id
// @access  Private
export const updateCommitment = async (req, res) => {
    try {
        let commitment = await Commitment.findById(req.params.id);

        if (!commitment) {
            return res.status(404).json({
                success: false,
                message: 'התחייבות לא נמצאה',
            });
        }

        // Check if commitment belongs to user's household
        if (commitment.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לעדכן התחייבות זו',
            });
        }

        commitment = await Commitment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            commitment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete commitment
// @route   DELETE /api/commitments/:id
// @access  Private
export const deleteCommitment = async (req, res) => {
    try {
        const commitment = await Commitment.findById(req.params.id);

        if (!commitment) {
            return res.status(404).json({
                success: false,
                message: 'התחייבות לא נמצאה',
            });
        }

        // Check if commitment belongs to user's household
        if (commitment.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה למחוק התחייבות זו',
            });
        }

        await commitment.deleteOne();

        res.json({
            success: true,
            message: 'התחייבות נמחקה בהצלחה',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Record payment for commitment
// @route   POST /api/commitments/:id/payment
// @access  Private
export const recordPayment = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין סכום תקין',
            });
        }

        const commitment = await Commitment.findById(req.params.id);

        if (!commitment) {
            return res.status(404).json({
                success: false,
                message: 'התחייבות לא נמצאה',
            });
        }

        // Check if commitment belongs to user's household
        if (commitment.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לעדכן התחייבות זו',
            });
        }

        commitment.remaining -= amount;
        if (commitment.remaining < 0) commitment.remaining = 0;

        // Recalculate payments left
        if (commitment.monthlyPayment > 0) {
            commitment.paymentsLeft = Math.ceil(commitment.remaining / commitment.monthlyPayment);
        }

        await commitment.save();

        res.json({
            success: true,
            commitment,
            message: `תשלום של ${amount} ₪ נרשם בהצלחה`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

