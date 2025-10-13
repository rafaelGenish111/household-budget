import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/config.js';

export const auth = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'לא מורשה - אין טוקן',
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'משתמש לא נמצא',
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'לא מורשה - טוקן לא תקין',
        });
    }
};

// Generate JWT Token
export const generateToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpire,
    });
};

