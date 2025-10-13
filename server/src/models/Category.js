import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
            default: null, // null = קטגוריה גלובלית
        },
        name: {
            type: String,
            required: [true, 'נא להזין שם קטגוריה'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: [true, 'נא לבחור סוג'],
        },
        subcategories: [
            {
                type: String,
                trim: true,
            },
        ],
        icon: {
            type: String,
            default: '',
        },
        color: {
            type: String,
            default: '#2196f3',
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for better performance
categorySchema.index({ household: 1, type: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;

