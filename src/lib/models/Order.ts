import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
    productId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    customerEmail: string;
    amount: number;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    refund?: {
        amount: number;
        reason: string;
        processedAt: Date;
        status: 'completed' | 'failed' | 'pending';
    };
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    refund: {
        amount: { type: Number },
        reason: { type: String },
        processedAt: { type: Date },
        status: { type: String, enum: ['completed', 'failed', 'pending'] }
    }
}, { timestamps: true });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export { Order };
export default Order;
