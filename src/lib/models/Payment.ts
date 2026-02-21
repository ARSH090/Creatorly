import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
    userId: string; // Clerk User ID
    subscriptionId: mongoose.Types.ObjectId;
    razorpayPaymentId: string;
    amount: number; // In paise
    status: 'captured' | 'failed' | 'refunded';
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    razorpayPaymentId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['captured', 'failed', 'refunded'],
        required: true
    },
    currency: { type: String, default: 'INR' }
}, { timestamps: true });

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
