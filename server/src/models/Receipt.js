import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
            required: true,
        },
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction',
        },
        imageUrl: {
            type: String,
            required: true,
        },
        scannedData: {
            date: Date,
            total: Number,
            businessName: String,
            category: String,
            items: [
                {
                    name: String,
                    price: Number,
                },
            ],
            rawText: String,
            confidence: Number,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Receipt = mongoose.model('Receipt', receiptSchema);

export default Receipt;

