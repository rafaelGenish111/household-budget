import User from '../models/User.js';
import Household from '../models/Household.js';
import Category from '../models/Category.js';
import Invitation from '../models/Invitation.js';
import { generateToken } from '../middleware/auth.js';
import { defaultCategories } from '../utils/defaultCategories.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { name, email, password, householdName } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'משתמש עם אימייל זה כבר קיים',
            });
        }

        // Create household
        const household = await Household.create({
            name: householdName || `משק הבית של ${name}`,
            members: [],
        });

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            household: household._id,
            role: 'admin',
        });

        // Add user to household members
        household.members.push({
            user: user._id,
            role: 'admin',
        });
        await household.save();

        // Create default categories for household
        const categoriesWithHousehold = defaultCategories.map((cat) => ({
            ...cat,
            household: household._id,
        }));
        await Category.insertMany(categoriesWithHousehold);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                household: household._id,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין אימייל וסיסמה',
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'אימייל או סיסמה שגויים',
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'אימייל או סיסמה שגויים',
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                household: user.household,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('household');

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                household: user.household,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'משתמש לא נמצא',
            });
        }

        // TODO: Implement email service
        res.json({
            success: true,
            message: 'אימייל לאיפוס סיסמה נשלח (לא ממומש עדיין)',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        // TODO: Implement password reset logic
        res.json({
            success: true,
            message: 'איפוס סיסמה (לא ממומש עדיין)',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Verify invitation
// @route   GET /api/auth/invitation/:token
// @access  Public
export const verifyInvitation = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await Invitation.findOne({
            token,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        }).populate('household', 'name');

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'הזמנה לא תקפה או פגה תוקפה',
            });
        }

        res.json({
            success: true,
            invitation: {
                email: invitation.email,
                householdName: invitation.household.name,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Register with invitation
// @route   POST /api/auth/register-with-invitation
// @access  Public
export const registerWithInvitation = async (req, res) => {
    try {
        const { name, email, password, invitationToken } = req.body;

        // Verify invitation
        const invitation = await Invitation.findOne({
            token: invitationToken,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'הזמנה לא תקפה או פגה תוקפה',
            });
        }

        // Check email match
        if (invitation.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: 'האימייל לא תואם את ההזמנה',
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // Existing user
            if (user.household) {
                return res.status(400).json({
                    success: false,
                    message: 'משתמש זה כבר משויך למשק בית אחר',
                });
            }

            user.household = invitation.household;
            user.role = 'member';
            await user.save();
        } else {
            // New user
            user = await User.create({
                name,
                email,
                password,
                household: invitation.household,
                role: 'member',
            });
        }

        // Add user to household
        const household = await Household.findById(invitation.household);
        household.members.push({
            user: user._id,
            role: 'member',
        });
        await household.save();

        // Update invitation
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        await invitation.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                household: user.household,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Accept invitation (for logged-in users)
// @route   POST /api/auth/accept-invitation
// @access  Private
export const acceptInvitation = async (req, res) => {
    try {
        const { invitationToken } = req.body;

        const invitation = await Invitation.findOne({
            token: invitationToken,
            email: req.user.email,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'הזמנה לא תקפה',
            });
        }

        if (req.user.household) {
            return res.status(400).json({
                success: false,
                message: 'אתה כבר משויך למשק בית',
            });
        }

        // Connect to household
        req.user.household = invitation.household;
        req.user.role = 'member';
        await req.user.save();

        const household = await Household.findById(invitation.household);
        household.members.push({
            user: req.user._id,
            role: 'member',
        });
        await household.save();

        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        await invitation.save();

        res.json({
            success: true,
            message: 'הצטרפת בהצלחה למשק הבית',
            household,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

