import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayout extends Document {
    creatorId: mongoose.Types.ObjectId;
    amount: number;
    status: 'pending' | 'processed' | 'failed' | 'rejected';
    razorpayPayoutId?: string;
    transactionId?: string;
    processedAt?: Date;
    processedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    createdAt: Date;
}

const PayoutSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processed', 'failed', 'rejected'],
        default: 'pending'
    },
    razorpayPayoutId: { type: String },
    transactionId: { type: String },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String }
}, { timestamps: true });

const Payout: Model<IPayout> = mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);
export default Payout;
