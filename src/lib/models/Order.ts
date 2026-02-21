import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
    orderNumber: string;
    items: Array<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        type: string;
        variantId?: string;
        tax?: number;
    }>;
    creatorId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    customerEmail: string;
    customerName?: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    amount: number;
    taxAmount?: number;
    discountAmount?: number;
    tipAmount?: number;
    total: number;
    currency: string;
    paymentGateway?: 'razorpay' | 'stripe' | 'paypal';
    paymentMethod?: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: 'pending' | 'payment_initiated' | 'processing' | 'completed' | 'success' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    paidAt?: Date;
    commissionAmount?: number;
    affiliateId?: string;
    couponId?: string;
    subscriptionId?: mongoose.Types.ObjectId | string;

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
    internalNotes?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}


const OrderSchema: Schema = new Schema({
    orderNumber: { type: String, required: true, unique: true, index: true }, // e.g., CR-123456
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        type: { type: String, required: true },
        variantId: { type: String },
        tax: { type: Number, default: 0 }
    }],
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerEmail: { type: String, required: true },
    customerName: { type: String },

    // Billing
    billingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },

    // Amounts
    amount: { type: Number, required: true }, // Subtotal
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    tipAmount: { type: Number, default: 0 },
    total: { type: Number, required: true }, // Final amount
    currency: { type: String, default: 'INR' },

    // Payment Info
    paymentGateway: { type: String, enum: ['razorpay', 'stripe', 'paypal'], default: 'razorpay' },
    paymentMethod: { type: String }, // e.g. 'upi', 'card', 'netbanking'
    razorpayOrderId: { type: String, unique: true, sparse: true }, // Not required initially if another gateway
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: {
        type: String,
        enum: ['pending', 'payment_initiated', 'processing', 'completed', 'success', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
        default: 'pending',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    paidAt: { type: Date },

    // Affiliates/Coupons
    commissionAmount: { type: Number, default: 0 },
    affiliateId: { type: String },
    couponId: { type: String },

    // Delivery & Tracking
    downloadCount: { type: Number, default: 0 },
    downloadLimit: { type: Number, default: 3 },
    downloadHistory: [Date],
    ipAddress: String,

    // Refunds
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
    internalNotes: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    deletedAt: { type: Date, index: true }
}, { timestamps: true });


// Indexes for performance
OrderSchema.index({ creatorId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ customerEmail: 1, createdAt: -1 });
OrderSchema.index({ "items.productId": 1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export { Order };
export default Order;
