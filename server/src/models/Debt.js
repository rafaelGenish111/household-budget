import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    note: {
        type: String,
        trim: true,
    },
    paymentMethod: {
        type: String,
        enum: ['מזומן', 'העברה בנקאית', "צ'ק", 'אחר'],
        default: 'מזומן',
    },
});

const debtSchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['owe', 'owed'],
            required: [true, 'נא לבחור סוג חוב'],
        },
        creditorName: {
            type: String,
            required: [true, 'נא להזין שם נושה/חייב'],
            trim: true,
        },
        originalAmount: {
            type: Number,
            required: [true, 'נא להזין סכום מקורי'],
            min: [0, 'הסכום חייב להיות חיובי'],
        },
        remainingAmount: {
            type: Number,
            required: [true, 'נא להזין סכום נותר'],
            min: [0, 'הסכום חייב להיות חיובי'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'התיאור ארוך מדי'],
        },
        dueDate: {
            type: Date,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        payments: [paymentSchema],
        interestRate: {
            type: Number,
            default: 0,
            min: [0, 'אחוז הריבית חייב להיות חיובי'],
            max: [100, 'אחוז הריבית לא יכול לעבור 100'],
        },
        category: {
            type: String,
            enum: ['personal', 'family', 'bank', 'business', 'other'],
            default: 'personal',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['active', 'paid', 'overdue'],
            default: 'active',
        },
        reminderEnabled: {
            type: Boolean,
            default: false,
        },
        reminderDays: {
            type: Number,
            default: 7,
        },
    },
    {
        timestamps: true,
    }
);

debtSchema.index({ household: 1, status: 1 });
debtSchema.index({ household: 1, type: 1, status: 1 });
debtSchema.index({ dueDate: 1, status: 1 });

debtSchema.virtual('totalPaid').get(function () {
    return this.originalAmount - this.remainingAmount;
});

debtSchema.virtual('progressPercentage').get(function () {
    if (this.originalAmount === 0) return 0;
    return Math.round(((this.originalAmount - this.remainingAmount) / this.originalAmount) * 100);
});

debtSchema.methods.addPayment = async function (amount, note = '', paymentMethod = 'מזומן') {
    if (amount <= 0) {
        throw new Error('הסכום חייב להיות חיובי');
    }
    if (amount > this.remainingAmount) {
        throw new Error('הסכום גדול מהחוב הנותר');
    }

    this.payments.push({
        amount,
        note,
        paymentMethod,
        date: new Date(),
    });

    this.remainingAmount -= amount;

    if (this.remainingAmount === 0) {
        this.status = 'paid';
    }

    await this.save();
    return this;
};

debtSchema.methods.checkOverdue = function () {
    if (this.dueDate && new Date() > this.dueDate && this.status === 'active') {
        this.status = 'overdue';
        return true;
    }
    return false;
};

debtSchema.statics.getSummary = async function (household) {
    const summary = await this.aggregate([
        {
            $match: {
                household: new mongoose.Types.ObjectId(household),
                status: { $in: ['active', 'overdue'] },
            },
        },
        {
            $group: {
                _id: '$type',
                totalRemaining: { $sum: '$remainingAmount' },
                count: { $sum: 1 },
            },
        },
    ]);

    const owe = summary.find((s) => s._id === 'owe') || { totalRemaining: 0, count: 0 };
    const owed = summary.find((s) => s._id === 'owed') || { totalRemaining: 0, count: 0 };

    return {
        totalOwe: owe.totalRemaining,
        countOwe: owe.count,
        totalOwed: owed.totalRemaining,
        countOwed: owed.count,
        netDebt: owe.totalRemaining - owed.totalRemaining,
    };
};

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

const Debt = mongoose.model('Debt', debtSchema);

export default Debt;


