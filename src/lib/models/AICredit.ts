import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * AI Credit Transaction Types
 */
export enum CreditTransactionType {
    PURCHASE = 'purchase',
    USAGE = 'usage',
    BONUS = 'bonus',
    REFUND = 'refund',
    EXPIRED = 'expired'
}

/**
 * AI Credit Package Types
 */
export enum CreditPackage {
    STARTER = 'starter',
    PROFESSIONAL = 'professional',
    ENTERPRISE = 'enterprise'
}

/**
 * AI Credit Interface
 */
export interface IAICredit extends Document {
    creatorId: mongoose.Types.ObjectId;
    totalCredits: number;
    usedCredits: number;
    remainingCredits: number;
    packageType: CreditPackage;
    expiresAt: Date;
    autoReload: boolean;
    autoReloadThreshold: number;
    autoReloadAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * AI Credit Transaction Interface
 */
export interface IAICreditTransaction extends Document {
    creatorId: mongoose.Types.ObjectId;
    amount: number;
    type: CreditTransactionType;
    description: string;
    metadata?: Record<string, any>;
    balanceAfter: number;
    createdAt: Date;
}

/**
 * AI Credit Document Interface (includes instance methods)
 */
export interface IAICreditDocument extends IAICredit, Document {
    _id: mongoose.Types.ObjectId;
    useCredits(amount: number, description: string, metadata?: Record<string, any>): Promise<IAICreditDocument>;
    addCredits(amount: number, type: CreditTransactionType, description: string, metadata?: Record<string, any>): Promise<IAICreditDocument>;
}

/**
 * AI Credit Model Interface (includes static methods)
 */
export interface IAICreditModel extends Model<IAICreditDocument> {
    getOrCreate(creatorId: mongoose.Types.ObjectId | string): Promise<IAICreditDocument>;
}

/**
 * AI Credit Schema
 */
const AICreditSchema: Schema<IAICreditDocument, IAICreditModel> = new Schema({
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    totalCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    usedCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    packageType: {
        type: String,
        enum: Object.values(CreditPackage),
        default: CreditPackage.STARTER
    },
    expiresAt: {
        type: Date,
        default: null
    },
    autoReload: {
        type: Boolean,
        default: false
    },
    autoReloadThreshold: {
        type: Number,
        default: 10,
        min: 0
    },
    autoReloadAmount: {
        type: Number,
        default: 100,
        min: 0
    }
}, {
    timestamps: true
});

/**
 * AI Credit Transaction Schema
 */
const AICreditTransactionSchema: Schema = new Schema({
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(CreditTransactionType),
        required: true
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    balanceAfter: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// TTL: Keep transactions for 1 year
AICreditTransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

/**
 * Get or create AICredit for a creator
 */
AICreditSchema.statics.getOrCreate = async function (creatorId: mongoose.Types.ObjectId | string) {
    let credit = await this.findOne({ creatorId });

    if (!credit) {
        credit = await this.create({
            creatorId,
            totalCredits: 0,
            usedCredits: 0,
            remainingCredits: 0,
            packageType: CreditPackage.STARTER
        });
    }

    return credit;
};

/**
 * Use credits
 */
AICreditSchema.methods.useCredits = async function (amount: number, description: string, metadata?: Record<string, any>) {
    if (this.remainingCredits < amount) {
        throw new Error('Insufficient credits');
    }

    this.usedCredits += amount;
    this.remainingCredits -= amount;

    // Create transaction record
    await AICreditTransaction.create({
        creatorId: this.creatorId,
        amount: -amount,
        type: CreditTransactionType.USAGE,
        description,
        metadata,
        balanceAfter: this.remainingCredits
    });

    return this.save();
};

/**
 * Add credits
 */
AICreditSchema.methods.addCredits = async function (amount: number, type: CreditTransactionType, description: string, metadata?: Record<string, any>) {
    this.totalCredits += amount;
    this.remainingCredits += amount;

    // Create transaction record
    await AICreditTransaction.create({
        creatorId: this.creatorId,
        amount,
        type,
        description,
        metadata,
        balanceAfter: this.remainingCredits
    });

    return this.save();
};

export const AICredit = (mongoose.models.AICredit as IAICreditModel) ||
    mongoose.model<IAICreditDocument, IAICreditModel>('AICredit', AICreditSchema);

export const AICreditTransaction = (mongoose.models.AICreditTransaction as Model<IAICreditTransaction>) ||
    mongoose.model<IAICreditTransaction>('AICreditTransaction', AICreditTransactionSchema);

export default AICredit;
