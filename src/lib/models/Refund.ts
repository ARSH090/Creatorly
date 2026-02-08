import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRefund extends Document {
    orderId: mongoose.Types.ObjectId;
    razorpayPaymentId: string;
    razorpayRefundId?: string;
    amount: number;
    reason: string;
    status: 'pending' | 'initiated' | 'success' | 'failed';
    requestedAt: Date;
    processedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RefundSchema: Schema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    razorpayPaymentId: {
        type: String,
        required: true,
        index: true,
    },
    razorpayRefundId: String,
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'customer_request',
            'damaged_product',
            'wrong_item',
            'duplicate_charge',
            'payment_issue',
            'other',
        ],
    },
    status: {
        type: String,
        enum: ['pending', 'initiated', 'success', 'failed'],
        default: 'pending',
        index: true,
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: Date,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default (mongoose.models.Refund as Model<IRefund>) ||
    mongoose.model<IRefund>('Refund', RefundSchema);
