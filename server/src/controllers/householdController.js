import Household from '../models/Household.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import { sendHouseholdInviteEmail } from '../utils/emailService.js';

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
// @access  Private (Admin only)
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

        // Check if email is already a member
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.household?.toString() === household._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'משתמש זה כבר חבר במשק הבית',
            });
        }

        // Check if there's a pending invitation
        const existingInvitation = await Invitation.findOne({
            email,
            household: household._id,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });

        if (existingInvitation) {
            return res.status(400).json({
                success: false,
                message: 'כבר נשלחה הזמנה למייל זה',
            });
        }

        // Create new invitation
        const token = Invitation.createToken();
        const invitation = await Invitation.create({
            household: household._id,
            email,
            invitedBy: req.user._id,
            token,
        });

        // Send email (or display in console)
        const emailResult = await sendHouseholdInviteEmail(email, household.name, token);

        res.status(201).json({
            success: true,
            message: emailResult.message,
            invitation: {
                id: invitation._id,
                email: invitation.email,
                expiresAt: invitation.expiresAt,
                inviteUrl: emailResult.inviteUrl,
            },
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

// @desc    Get pending invitations
// @route   GET /api/household/invitations
// @access  Private (Admin only)
export const getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({
            household: req.user.household,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        })
            .populate('invitedBy', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            invitations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Cancel invitation
// @route   DELETE /api/household/invitation/:invitationId
// @access  Private (Admin only)
export const cancelInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;

        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'הזמנה לא נמצאה',
            });
        }

        if (invitation.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין לך הרשאה לבטל הזמנה זו',
            });
        }

        invitation.status = 'cancelled';
        await invitation.save();

        res.json({
            success: true,
            message: 'הזמנה בוטלה בהצלחה',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

