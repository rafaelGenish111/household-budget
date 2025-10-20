import mongoose from 'mongoose';

const commitmentSchema = new mongoose.Schema(
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
        name: {
            type: String,
            required: [true, 'נא להזין שם ההתחייבות'],
            trim: true,
        },
        totalAmount: {
            type: Number,
            required: [true, 'נא להזין סכום כולל'],
            min: [0, 'הסכום חייב להיות חיובי'],
        },
        remaining: {
            type: Number,
            required: [true, 'נא להזין סכום נותר'],
            min: [0, 'הסכום חייב להיות חיובי'],
        },
        monthlyPayment: {
            type: Number,
            required: [true, 'נא להזין תשלום חודשי'],
            min: [0, 'התשלום חייב להיות חיובי'],
        },
        paymentsLeft: {
            type: Number,
            required: [true, 'נא להזין מספר תשלומים נותרים'],
            min: [0, 'מספר התשלומים חייב להיות חיובי'],
        },
        startDate: {
            type: Date,
            required: [true, 'נא לבחור תאריך התחלה'],
        },
        // 🆕 שדות לתזמון אוטומטי
        billingDay: {
            type: Number,
            min: [1, 'יום החיוב חייב להיות בין 1-31'],
            max: [31, 'יום החיוב חייב להיות בין 1-31'],
            default: 1,
        },
        category: {
            type: String,
            default: 'חשבונות',
            trim: true,
        },
        subcategory: {
            type: String,
            trim: true,
            default: '',
        },
        autoCreateTransaction: {
            type: Boolean,
            default: true,
        },
        isTimeLimited: {
            type: Boolean,
            default: false,
        },
        endDate: {
            type: Date,
            default: null,
        },
        lastTransactionDate: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        paymentMethod: {
            type: String,
            enum: ['מזומן', 'אשראי', 'העברה בנקאית', "צ'ק", 'אחר'],
            default: 'אשראי',
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'התיאור ארוך מדי'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
commitmentSchema.index({ household: 1, isActive: 1, billingDay: 1 });
commitmentSchema.index({ household: 1, lastTransactionDate: 1 });

// Method: should create monthly transaction today?
commitmentSchema.methods.shouldCreateTransaction = function (today) {
    if (!this.autoCreateTransaction || !this.isActive) return false;
    if (this.isTimeLimited && this.endDate && today > this.endDate) {
        this.isActive = false;
        return false;
    }

    const currentDay = today.getDate();
    if (currentDay !== this.billingDay) return false;

    if (this.lastTransactionDate) {
        const last = this.lastTransactionDate;
        if (last.getFullYear() === today.getFullYear() && last.getMonth() === today.getMonth()) {
            return false; // already created this month
        }
    }
    return true;
};

const Commitment = mongoose.model('Commitment', commitmentSchema);

export default Commitment;

