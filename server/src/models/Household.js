import mongoose from 'mongoose';

const householdSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'נא להזין שם משק בית'],
            trim: true,
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['admin', 'member'],
                    default: 'member',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Household = mongoose.model('Household', householdSchema);

export default Household;

