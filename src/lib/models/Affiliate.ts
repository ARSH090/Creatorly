import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliate extends Document {
    creatorId: mongoose.Types.ObjectId;
    affiliateId: mongoose.Types.ObjectId;
    affiliateCode: string;
    commissionRate: number;
    totalEarnings: number;
    totalCommission: number;
    paidCommission: number;
    referrals: number;
    clicks: number;
    conversions: number;
    status: 'pending' | 'active' | 'suspended';
    isActive: boolean;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AffiliateSchema: Schema = new Schema({
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    affiliateId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    affiliateCode: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    commissionRate: {
        type: Number,
        default: 10, // 10% commission rate
        min: 0,
        max: 100,
    },
    totalEarnings: {
        type: Number,
        default: 0,
    },
    totalCommission: {
        type: Number,
        default: 0,
    },
    paidCommission: {
        type: Number,
        default: 0,
    },
    referrals: {
        type: Number,
        default: 0,
    },
    clicks: {
        type: Number,
        default: 0,
    },
    conversions: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'active',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    paidAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export interface IAffiliateClick extends Document {
    affiliateId: mongoose.Types.ObjectId;
    referralCode: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    converted: boolean;
    orderId?: mongoose.Types.ObjectId;
}

const AffiliateClickSchema: Schema = new Schema({
    affiliateId: {
        type: Schema.Types.ObjectId,
        ref: 'Affiliate',
        required: true,
        index: true,
    },
    referralCode: String,
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    converted: {
        type: Boolean,
        default: false,
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
    },
});

export const Affiliate = (mongoose.models.Affiliate as Model<IAffiliate>) ||
    mongoose.model<IAffiliate>('Affiliate', AffiliateSchema);

export const AffiliateClick = (mongoose.models.AffiliateClick as Model<IAffiliateClick>) ||
    mongoose.model<IAffiliateClick>('AffiliateClick', AffiliateClickSchema);
