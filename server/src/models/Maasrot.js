import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'נא להזין סכום התרומה'],
        min: [0, 'סכום התרומה חייב להיות חיובי'],
    },
    date: {
        type: Date,
        required: [true, 'נא לבחור תאריך התרומה'],
        default: Date.now,
    },
    description: {
        type: String,
        trim: true,
        maxLength: [200, 'התיאור לא יכול להיות ארוך מ-200 תווים'],
    },
}, {
    timestamps: true,
});

const maasrotSchema = new mongoose.Schema({
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
    monthlyIncome: {
        type: Number,
        required: true,
        min: [0, 'ההכנסה החודשית חייבת להיות חיובית'],
    },
    maasrotTarget: {
        type: Number,
        required: true,
        min: [0, 'יעד המעשרות חייב להיות חיובי'],
    },
    donations: [donationSchema],
    totalDonated: {
        type: Number,
        default: 0,
        min: [0, 'סך התרומות חייב להיות חיובי'],
    },
    remaining: {
        type: Number,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Virtual for calculating remaining amount
maasrotSchema.virtual('calculatedRemaining').get(function () {
    return this.maasrotTarget - this.totalDonated;
});

// Method to add donation
maasrotSchema.methods.addDonation = function (donationData) {
    this.donations.push(donationData);
    this.totalDonated = this.donations.reduce((sum, donation) => sum + donation.amount, 0);
    this.remaining = this.maasrotTarget - this.totalDonated;
    this.lastUpdated = new Date();
    return this.save();
};

// Method to update monthly income and recalculate target
maasrotSchema.methods.updateMonthlyIncome = function (newIncome) {
    this.monthlyIncome = newIncome;
    this.maasrotTarget = Math.round(newIncome * 0.1); // 10% of income
    this.remaining = this.maasrotTarget - this.totalDonated;
    this.lastUpdated = new Date();
    return this.save();
};

// Static method to get or create maasrot for household
maasrotSchema.statics.getOrCreate = async function (householdId, userId, monthlyIncome = 0) {
    let maasrot = await this.findOne({ household: householdId });

    if (!maasrot) {
        const maasrotTarget = Math.round(monthlyIncome * 0.1);
        maasrot = await this.create({
            household: householdId,
            user: userId,
            monthlyIncome,
            maasrotTarget,
            remaining: maasrotTarget,
        });
    } else if (monthlyIncome > 0 && maasrot.monthlyIncome !== monthlyIncome) {
        await maasrot.updateMonthlyIncome(monthlyIncome);
    }

    return maasrot;
};

// Pre-save middleware to update calculated fields
maasrotSchema.pre('save', function (next) {
    this.totalDonated = this.donations.reduce((sum, donation) => sum + donation.amount, 0);
    this.remaining = this.maasrotTarget - this.totalDonated;
    next();
});

// Index for efficient queries
maasrotSchema.index({ household: 1 });
maasrotSchema.index({ user: 1 });

export default mongoose.model('Maasrot', maasrotSchema);
