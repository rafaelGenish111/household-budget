import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
            required: true,
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: [true, 'נא לבחור סוג תנועה'],
        },
        category: {
            type: String,
            required: [true, 'נא לבחור קטגוריה'],
            trim: true,
        },
        subcategory: {
            type: String,
            trim: true,
            default: '',
        },
        amount: {
            type: Number,
            required: [true, 'נא להזין סכום'],
            min: [0, 'הסכום חייב להיות חיובי'],
        },
        date: {
            type: Date,
            required: [true, 'נא לבחור תאריך'],
            default: Date.now,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        paymentMethod: {
            type: String,
            enum: ['מזומן', 'אשראי', 'העברה בנקאית', 'צ\'ק', 'אחר'],
            default: 'מזומן',
        },
        installments: {
            type: Number,
            min: 1,
            max: 36,
            default: 1,
        },
        installmentAmount: {
            type: Number,
            default: 0,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receipt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Receipt',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better performance
transactionSchema.index({ household: 1, date: -1 });
transactionSchema.index({ household: 1, category: 1, date: -1 });
transactionSchema.index({ household: 1, type: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;

