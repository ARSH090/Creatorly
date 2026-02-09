import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    couponId?: mongoose.Types.ObjectId;

    // Pricing (Locked at time of purchase)
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;

    billingPeriod: 'monthly' | 'yearly';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'canceled' | 'expired' | 'past_due' | 'pending';
    autoRenew: boolean;

    // Payment provider fields
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;

    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true }, // Replaced planId
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },

    originalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalPrice: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (this: any, val: number) {
                return Math.abs(val - (this.originalPrice - this.discountAmount)) < 0.01;
            },
            message: 'Price integrity check failed: finalPrice must equal originalPrice - discountAmount'
        }
    },

    billingPeriod: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    startDate: { type: Date, default: Date.now },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (this: any, val: Date) {
                return val > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'expired', 'past_due', 'pending'],
        default: 'active',
        index: true
    },
    autoRenew: { type: Boolean, default: true },

    razorpaySubscriptionId: { type: String, sparse: true, unique: true },
    razorpayCustomerId: { type: String },
}, { timestamps: true });

// Integrity check on save
SubscriptionSchema.pre('validate', function (this: any, next: any) {
    if (this.finalPrice !== this.originalPrice - this.discountAmount) {
        this.finalPrice = this.originalPrice - this.discountAmount;
    }
    if (this.finalPrice < 0) this.finalPrice = 0;
    next();
});

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
