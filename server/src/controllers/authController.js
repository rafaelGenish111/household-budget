import User from '../models/User.js';
import Household from '../models/Household.js';
import Category from '../models/Category.js';
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

