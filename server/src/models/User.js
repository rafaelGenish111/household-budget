import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'נא להזין שם'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'נא להזין אימייל'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'נא להזין אימייל תקין'],
        },
        password: {
            type: String,
            required: [true, 'נא להזין סיסמה'],
            minlength: [6, 'הסיסמה חייבת להכיל לפחות 6 תווים'],
            select: false,
        },
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'admin',
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

