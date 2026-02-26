import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliatePayout extends Document {
    affiliateId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: 'scheduled' | 'processing' | 'paid' | 'failed';
    paymentMethod?: string; // 'bank_transfer', 'upi', 'paypal'
    transactionId?: string;
    notes?: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AffiliatePayoutSchema: Schema = new Schema({
    affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['scheduled', 'processing', 'paid', 'failed'],
        default: 'scheduled',
        index: true
    },
    paymentMethod: { type: String },
    transactionId: { type: String },
    notes: { type: String },
    paidAt: { type: Date }
}, { timestamps: true });

const AffiliatePayout: Model<IAffiliatePayout> = mongoose.models.AffiliatePayout || mongoose.model<IAffiliatePayout>('AffiliatePayout', AffiliatePayoutSchema);

export default AffiliatePayout;
