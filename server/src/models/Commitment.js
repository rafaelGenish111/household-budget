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
    },
    {
        timestamps: true,
    }
);

const Commitment = mongoose.model('Commitment', commitmentSchema);

export default Commitment;

