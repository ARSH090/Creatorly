import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
    productId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    customerEmail: string;
    amount: number;
    currency: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';

    // Delivery & Tracking
    downloadCount: number;
    downloadLimit: number;
    downloadHistory: Date[];
    ipAddress?: string;

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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending'
    },

    downloadCount: { type: Number, default: 0 },
    downloadLimit: { type: Number, default: 3 },
    downloadHistory: [Date],
    ipAddress: String,

    refund: {
        amount: { type: Number },
        reason: { type: String },
        processedAt: { type: Date },
        status: { type: String, enum: ['completed', 'failed', 'pending'] }
    }
}, { timestamps: true });

// Indexes for performance
OrderSchema.index({ creatorId: 1, createdAt: -1 });
OrderSchema.index({ productId: 1 });
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ status: 1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export { Order };
export default Order;
