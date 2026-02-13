import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
    items: Array<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        type: string;
    }>;
    creatorId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    customerEmail: string;
    customerName?: string;
    amount: number;
    total: number;
    currency: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    paidAt?: Date;
    commissionAmount?: number;
    affiliateId?: string;

    // Delivery & Tracking
    downloadCount: number;
    downloadLimit: number;
    downloadHistory: Date[];
    ipAddress?: string;

    refundStatus: 'NONE' | 'REQUESTED' | 'COMPLETED' | 'FAILED';
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
    refundedBy?: mongoose.Types.ObjectId;
    razorpayRefundId?: string;
    refund?: {
        amount: number;
        reason: string;
        processedAt: Date;
        status: 'completed' | 'failed' | 'pending';
        refundId?: string;
    };
    deviceFingerprint?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}


const OrderSchema: Schema = new Schema({
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        type: { type: String, required: true }
    }],
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerEmail: { type: String, required: true },
    customerName: { type: String },
    amount: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    paidAt: { type: Date },
    commissionAmount: { type: Number, default: 0 },
    affiliateId: { type: String },

    downloadCount: { type: Number, default: 0 },
    downloadLimit: { type: Number, default: 3 },
    downloadHistory: [Date],
    ipAddress: String,

    refundStatus: {
        type: String,
        enum: ['NONE', 'REQUESTED', 'COMPLETED', 'FAILED'],
        default: 'NONE'
    },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundedAt: { type: Date },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    razorpayRefundId: { type: String },
    refund: {
        amount: { type: Number },
        reason: { type: String },
        processedAt: { type: Date },
        status: { type: String, enum: ['completed', 'failed', 'pending'] },
        refundId: { type: String }
    },
    deviceFingerprint: { type: String, index: true },

    metadata: { type: Schema.Types.Mixed, default: {} },
    deletedAt: { type: Date, index: true }
}, { timestamps: true });


// Indexes for performance
OrderSchema.index({ creatorId: 1, createdAt: -1 });
OrderSchema.index({ productId: 1 });
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ status: 1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export { Order };
export default Order;
