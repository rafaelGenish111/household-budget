import Household from '../models/Household.js';
import User from '../models/User.js';

// @desc    Get household details
// @route   GET /api/household
// @access  Private
export const getHousehold = async (req, res) => {
    try {
        const household = await Household.findById(req.user.household).populate(
            'members.user',
            'name email'
        );

        if (!household) {
            return res.status(404).json({
                success: false,
                message: 'משק בית לא נמצא',
            });
        }

        res.json({
            success: true,
            household,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update household
// @route   PUT /api/household
// @access  Private
export const updateHousehold = async (req, res) => {
    try {
        const { name } = req.body;

        const household = await Household.findById(req.user.household);

        if (!household) {
            return res.status(404).json({
                success: false,
                message: 'משק בית לא נמצא',
            });
        }

        // Check if user is admin
        const member = household.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member || member.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'רק מנהל משק הבית יכול לעדכן פרטים',
            });
        }

        household.name = name || household.name;
        await household.save();

        res.json({
            success: true,
            household,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Invite user to household
// @route   POST /api/household/invite
// @access  Private
export const inviteUser = async (req, res) => {
    try {
        const { email } = req.body;

        const household = await Household.findById(req.user.household);

        if (!household) {
            return res.status(404).json({
                success: false,
                message: 'משק בית לא נמצא',
            });
        }

        // Check if user is admin
        const member = household.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member || member.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'רק מנהל משק הבית יכול להזמין משתמשים',
            });
        }

        // Find user by email
        const userToInvite = await User.findOne({ email });

        if (!userToInvite) {
            return res.status(404).json({
                success: false,
                message: 'משתמש עם אימייל זה לא נמצא',
            });
        }

        // Check if user is already a member
        const alreadyMember = household.members.some(
            (m) => m.user.toString() === userToInvite._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: 'משתמש זה כבר חבר במשק הבית',
            });
        }

        // Add user to household
        household.members.push({
            user: userToInvite._id,
            role: 'member',
        });
        await household.save();

        // Update user's household
        userToInvite.household = household._id;
        await userToInvite.save();

        res.json({
            success: true,
            message: 'משתמש הוזמן בהצלחה',
            household,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Remove user from household
// @route   DELETE /api/household/member/:userId
// @access  Private
export const removeMember = async (req, res) => {
    try {
        const { userId } = req.params;

        const household = await Household.findById(req.user.household);

        if (!household) {
            return res.status(404).json({
                success: false,
                message: 'משק בית לא נמצא',
            });
        }

        // Check if user is admin
        const member = household.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member || member.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'רק מנהל משק הבית יכול להסיר משתמשים',
            });
        }

        // Cannot remove yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'לא ניתן להסיר את עצמך ממשק הבית',
            });
        }

        // Remove member
        household.members = household.members.filter(
            (m) => m.user.toString() !== userId
        );
        await household.save();

        res.json({
            success: true,
            message: 'משתמש הוסר בהצלחה',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

