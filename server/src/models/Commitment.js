import mongoose from 'mongoose';

const commitmentSchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
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
        isRecurring: {
            type: Boolean,
            default: true,
            description: 'האם זה תשלום חודשי אוטומטי'
        },
        recurringDay: {
            type: Number,
            min: 1,
            max: 31,
            default: 1,
            description: 'יום בחודש לביצוע התשלום (1-31)'
        },
        recurringCategory: {
            type: String,
            default: 'החזרי הלוואות',
            description: 'שם הקטגוריה שתיווצר בהוצאה'
        },
        lastProcessedDate: {
            type: Date,
            default: null,
            description: 'תאריך אחרון שבו עובד התשלום החודשי'
        },
    },
    {
        timestamps: true,
    }
);

const Commitment = mongoose.model('Commitment', commitmentSchema);

export default Commitment;

