
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
    orderId: mongoose.Types.ObjectId;
    gateway: 'razorpay' | 'stripe' | 'paypal';
    gatewayTransactionId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    eventType: 'payment' | 'refund' | 'dispute';
    gatewayResponse: Record<string, any>;
    createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    gateway: { type: String, required: true },
    gatewayTransactionId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], required: true },
    eventType: { type: String, enum: ['payment', 'refund', 'dispute'], default: 'payment' },
    gatewayResponse: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: false
});

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export { Transaction };
export default Transaction;
