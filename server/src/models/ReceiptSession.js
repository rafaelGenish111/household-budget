/**
 * מודל ReceiptSession למעקב אחר חשבוניות רב-תמונתיות
 */

import mongoose from 'mongoose';

const ReceiptImageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    blob: {
        type: Buffer,
        required: true
    },
    processedBlob: {
        type: Buffer,
        required: false
    },
    ocrResult: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    parsedData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    order: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    overlappingLines: [{
        type: String
    }],
    overlapConfidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    metadata: {
        width: Number,
        height: Number,
        fileSize: Number,
        processingTime: Number
    }
}, {
    timestamps: true
});

const ReceiptSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    household: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Household',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: [ReceiptImageSchema],
    mergedResult: {
        items: [{
            description: String,
            price: Number,
            quantity: {
                type: Number,
                default: 1
            },
            unitPrice: Number,
            lineNumber: Number,
            confidence: Number,
            sourceImage: String
        }],
        total: Number,
        businessInfo: {
            name: String,
            taxId: String,
            address: String,
            phone: String,
            email: String
        },
        date: Date,
        allLines: [String],
        metadata: {
            mergeMethod: {
                type: String,
                enum: ['overlap', 'position', 'manual'],
                default: 'overlap'
            },
            totalImages: Number,
            processingTime: Number,
            gapsDetected: [String]
        }
    },
    status: {
        type: String,
        enum: ['capturing', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'capturing'
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    validation: {
        isValid: {
            type: Boolean,
            default: false
        },
        issues: [{
            type: {
                type: String,
                enum: ['sum_mismatch', 'gap_detected', 'sequence_gap', 'low_confidence', 'duplicate_items']
            },
            severity: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'medium'
            },
            message: String,
            details: mongoose.Schema.Types.Mixed
        }],
        recommendations: [String],
        overallScore: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        }
    },
    settings: {
        autoDetectEnd: {
            type: Boolean,
            default: true
        },
        minOverlapConfidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.6
        },
        maxImages: {
            type: Number,
            default: 10,
            min: 1,
            max: 20
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
}, {
    timestamps: true
});

// Indexes for better performance
// שים לב: sessionId כבר מוגדר כ-unique + index בסכימה, אין צורך להגדיר שוב
ReceiptSessionSchema.index({ household: 1, user: 1 });
ReceiptSessionSchema.index({ status: 1 });
ReceiptSessionSchema.index({ createdAt: -1 });

// Virtual for image count
ReceiptSessionSchema.virtual('imageCount').get(function () {
    return this.images.length;
});

// Virtual for processing progress
ReceiptSessionSchema.virtual('progress').get(function () {
    if (this.status === 'capturing') {
        return Math.min((this.images.length / this.settings.maxImages) * 100, 100);
    }
    return this.status === 'completed' ? 100 : 0;
});

// Methods
ReceiptSessionSchema.methods.addImage = function (imageData) {
    const image = {
        id: this.generateImageId(),
        blob: imageData.blob,
        processedBlob: imageData.processedBlob,
        ocrResult: imageData.ocrResult,
        parsedData: imageData.parsedData,
        order: this.images.length,
        timestamp: new Date(),
        metadata: imageData.metadata
    };

    this.images.push(image);
    this.updatedAt = new Date();

    return image;
};

ReceiptSessionSchema.methods.generateImageId = function () {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

ReceiptSessionSchema.methods.generateSessionId = function () {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

ReceiptSessionSchema.methods.updateOverlap = function (imageIndex, overlapData) {
    if (this.images[imageIndex]) {
        this.images[imageIndex].overlappingLines = overlapData.lines;
        this.images[imageIndex].overlapConfidence = overlapData.confidence;
        this.updatedAt = new Date();
    }
};

ReceiptSessionSchema.methods.completeSession = function (mergedResult, validation) {
    this.status = 'completed';
    this.mergedResult = mergedResult;
    this.validation = validation;
    this.confidence = validation.overallScore;
    this.completedAt = new Date();
    this.updatedAt = new Date();
};

ReceiptSessionSchema.methods.cancelSession = function () {
    this.status = 'cancelled';
    this.updatedAt = new Date();
};

ReceiptSessionSchema.methods.getLastImage = function () {
    return this.images[this.images.length - 1];
};

ReceiptSessionSchema.methods.getLastLines = function (count = 3) {
    const lastImage = this.getLastImage();
    if (lastImage && lastImage.parsedData && lastImage.parsedData.allLines) {
        return lastImage.parsedData.allLines.slice(-count);
    }
    return [];
};

ReceiptSessionSchema.methods.canAddMoreImages = function () {
    return this.images.length < this.settings.maxImages && this.status === 'capturing';
};

ReceiptSessionSchema.methods.detectReceiptEnd = function () {
    const lastImage = this.getLastImage();
    if (!lastImage || !lastImage.parsedData) return false;

    const lastLines = lastImage.parsedData.allLines.slice(-5);
    const endIndicators = [
        /סה["']כ|total|לתשלום/i,
        /תודה|thank you|להתראות/i,
        /ח\.פ\.|ע\.מ\./i,
        /מזומן|אשראי|cash|credit/i
    ];

    for (const line of lastLines) {
        if (endIndicators.some(pattern => pattern.test(line))) {
            return true;
        }
    }

    return false;
};

// Static methods
ReceiptSessionSchema.statics.createNewSession = function (householdId, userId, settings = {}) {
    const session = new this({
        sessionId: this.generateSessionId(),
        household: householdId,
        user: userId,
        settings: {
            autoDetectEnd: true,
            minOverlapConfidence: 0.6,
            maxImages: 10,
            ...settings
        }
    });

    return session;
};

ReceiptSessionSchema.statics.generateSessionId = function () {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

ReceiptSessionSchema.statics.findActiveSessions = function (householdId, userId) {
    return this.find({
        household: householdId,
        user: userId,
        status: { $in: ['capturing', 'processing'] }
    }).sort({ createdAt: -1 });
};

ReceiptSessionSchema.statics.findCompletedSessions = function (householdId, userId, limit = 50) {
    return this.find({
        household: householdId,
        user: userId,
        status: 'completed'
    }).sort({ completedAt: -1 }).limit(limit);
};

// Pre-save middleware
ReceiptSessionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Pre-remove middleware to clean up files
ReceiptSessionSchema.pre('remove', function (next) {
    // Here you could add logic to clean up stored files
    // For now, we'll just continue
    next();
});

const ReceiptSession = mongoose.model('ReceiptSession', ReceiptSessionSchema);

export default ReceiptSession;
