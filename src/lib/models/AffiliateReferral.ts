import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliateReferral extends Document {
    affiliateId: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    amount: number; // Order amount
    commissionAmount: number; // Earned by affiliate
    commissionPercent: number; // Rate at time of purchase
    currency: string;
    status: 'pending' | 'approved' | 'paid' | 'rejected' | 'refunded';
    payoutId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AffiliateReferralSchema: Schema = new Schema({
    affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    amount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid', 'rejected', 'refunded'],
        default: 'pending',
        index: true
    },
    payoutId: { type: Schema.Types.ObjectId, ref: 'AffiliatePayout', index: true }
}, { timestamps: true });

// Index for reporting
AffiliateReferralSchema.index({ affiliateId: 1, status: 1 });

const AffiliateReferral: Model<IAffiliateReferral> = mongoose.models.AffiliateReferral || mongoose.model<IAffiliateReferral>('AffiliateReferral', AffiliateReferralSchema);

export default AffiliateReferral;
