import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayout extends Document {
    creatorId: mongoose.Types.ObjectId;
    amount: number;
    status: 'pending' | 'approved' | 'processed' | 'paid' | 'failed' | 'rejected';
    notes?: string;
    razorpayPayoutId?: string;
    transactionId?: string;
    processedAt?: Date;
    processedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    currency?: string;
    payoutMethod?: string;
    createdAt: Date;
}

const PayoutSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'processed', 'paid', 'failed', 'rejected'],
        default: 'pending'
    },
    notes: { type: String },
    razorpayPayoutId: { type: String },
    transactionId: { type: String },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    currency: { type: String, default: 'INR' },
    payoutMethod: { type: String, default: 'bank' },
    rejectionReason: { type: String }
}, { timestamps: true });

const Payout: Model<IPayout> = mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);
export { Payout };
export default Payout;
