import mongoose from 'mongoose';

const budgetGoalSchema = new mongoose.Schema(
    {
        household: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Household',
            required: true,
        },
        month: {
            type: String, // Format: "2025-10"
            required: [true, 'נא לבחור חודש'],
        },
        monthlyIncomeGoal: {
            type: Number,
            default: 0,
            min: [0, 'יעד ההכנסה חייב להיות חיובי'],
        },
        categoryGoals: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Index for better performance
budgetGoalSchema.index({ household: 1, month: 1 }, { unique: true });

const BudgetGoal = mongoose.model('BudgetGoal', budgetGoalSchema);

export default BudgetGoal;

