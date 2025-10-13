import Saving from '../models/Saving.js';

// @desc    Get all savings
// @route   GET /api/savings
// @access  Private
export const getSavings = async (req, res) => {
    try {
        const savings = await Saving.find({ household: req.user.household }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: savings.length,
            savings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single saving
// @route   GET /api/savings/:id
// @access  Private
export const getSaving = async (req, res) => {
    try {
        const saving = await Saving.findById(req.params.id);

        if (!saving) {
            return res.status(404).json({
                success: false,
                message: 'חסכון לא נמצא',
            });
        }

        // Check if saving belongs to user's household
        if (saving.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לצפות בחסכון זה',
            });
        }

        res.json({
            success: true,
            saving,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create saving
// @route   POST /api/savings
// @access  Private
export const createSaving = async (req, res) => {
    try {
        const savingData = {
            ...req.body,
            household: req.user.household,
        };

        const saving = await Saving.create(savingData);

        res.status(201).json({
            success: true,
            saving,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update saving
// @route   PUT /api/savings/:id
// @access  Private
export const updateSaving = async (req, res) => {
    try {
        let saving = await Saving.findById(req.params.id);

        if (!saving) {
            return res.status(404).json({
                success: false,
                message: 'חסכון לא נמצא',
            });
        }

        // Check if saving belongs to user's household
        if (saving.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לעדכן חסכון זה',
            });
        }

        saving = await Saving.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            saving,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete saving
// @route   DELETE /api/savings/:id
// @access  Private
export const deleteSaving = async (req, res) => {
    try {
        const saving = await Saving.findById(req.params.id);

        if (!saving) {
            return res.status(404).json({
                success: false,
                message: 'חסכון לא נמצא',
            });
        }

        // Check if saving belongs to user's household
        if (saving.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה למחוק חסכון זה',
            });
        }

        await saving.deleteOne();

        res.json({
            success: true,
            message: 'חסכון נמחק בהצלחה',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Add contribution to saving
// @route   POST /api/savings/:id/contribute
// @access  Private
export const addContribution = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין סכום תקין',
            });
        }

        const saving = await Saving.findById(req.params.id);

        if (!saving) {
            return res.status(404).json({
                success: false,
                message: 'חסכון לא נמצא',
            });
        }

        // Check if saving belongs to user's household
        if (saving.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לעדכן חסכון זה',
            });
        }

        saving.current += amount;
        await saving.save();

        res.json({
            success: true,
            saving,
            message: `נוספו ${amount} ₪ לחסכון`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

