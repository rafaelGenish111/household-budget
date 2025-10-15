import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'expired', 'cancelled'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        acceptedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
invitationSchema.index({ token: 1 });
invitationSchema.index({ email: 1, household: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// יצירת token אקראי
invitationSchema.statics.createToken = function () {
    return crypto.randomBytes(32).toString('hex');
};

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
