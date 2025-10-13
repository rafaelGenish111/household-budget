import mongoose from 'mongoose';

const savingSchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'נא להזין שם החסכון'],
            trim: true,
        },
        goal: {
            type: Number,
            required: [true, 'נא להזין יעד'],
            min: [0, 'היעד חייב להיות חיובי'],
        },
        current: {
            type: Number,
            default: 0,
            min: [0, 'הסכום הנוכחי חייב להיות חיובי'],
        },
        monthlyContribution: {
            type: Number,
            default: 0,
            min: [0, 'התרומה החודשית חייבת להיות חיובית'],
        },
        targetDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Saving = mongoose.model('Saving', savingSchema);

export default Saving;

