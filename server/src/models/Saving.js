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
        isRecurring: {
            type: Boolean,
            default: false,
            description: 'האם זו הפקדה חודשית אוטומטית'
        },
        recurringDay: {
            type: Number,
            min: 1,
            max: 31,
            default: null,
            description: 'יום בחודש לביצוע ההפקדה (1-31)'
        },
        recurringCategory: {
            type: String,
            default: 'חסכונות',
            description: 'שם הקטגוריה שתיווצר בהוצאה'
        },
        lastProcessedDate: {
            type: Date,
            default: null,
            description: 'תאריך אחרון שבו עובדה ההפקדה החודשית'
        },
    },
    {
        timestamps: true,
    }
);

const Saving = mongoose.model('Saving', savingSchema);

export default Saving;

