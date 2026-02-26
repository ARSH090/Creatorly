import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliate extends Document {
    productId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    affiliateId?: mongoose.Types.ObjectId; // User ID of the affiliate
    affiliateEmail: string;
    affiliateCode: string; // unique tracking code
    commissionPercent: number;
    commissionRate?: number; // Alias for commissionPercent
    totalClicks: number;
    totalSales: number;
    totalEarned: number; // Legacy total
    totalEarnings: number; // Aggregated total for display
    totalCommission: number; // Aggregated earnings
    paidCommission: number; // Amount already paid
    referrals: number; // Total referral signups
    clicks: number; // Total link clicks
    conversions: number; // Total number of successful sales
    isPaid: boolean;
    status: 'active' | 'pending' | 'rejected' | 'suspended';
    createdAt: Date;
}

export interface IAffiliateClick extends Document {
    affiliateId: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    referralCode: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const AffiliateSchema = new Schema<IAffiliate>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    affiliateId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    affiliateEmail: { type: String, required: true, lowercase: true },
    affiliateCode: { type: String, required: true, unique: true },
    commissionPercent: { type: Number, required: true },
    commissionRate: { type: Number },
    totalClicks: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    paidCommission: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['active', 'pending', 'rejected', 'suspended'],
        default: 'active'
    }
}, { timestamps: true });

const Affiliate: Model<IAffiliate> = mongoose.models.Affiliate || mongoose.model<IAffiliate>('Affiliate', AffiliateSchema);

const AffiliateClickSchema = new Schema<IAffiliateClick>({
    affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    referralCode: { type: String, required: true },
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

const AffiliateClick: Model<IAffiliateClick> = mongoose.models.AffiliateClick || mongoose.model<IAffiliateClick>('AffiliateClick', AffiliateClickSchema);

export { Affiliate, AffiliateClick };
export default Affiliate;
