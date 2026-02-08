import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  minPurchase?: number;
  maxDiscount?: number;
  maxUses: number;
  usedCount: number;
  createdBy: string; // Admin ID
  createdAt: Date;
  validFrom: Date;
  validUntil: Date;
  validityPeriodMonths?: number; // Alternative to validUntil
  isActive: boolean;
  products?: string[]; // Optional: restrict to specific products
  creators?: string[]; // Optional: restrict to specific creators
  userUsage: Array<{
    userId: string;
    usedAt: Date;
    orderId: string;
  }>;
  metadata?: {
    appliedCount?: number;
    successCount?: number;
    failedCount?: number;
    totalDiscountGiven?: number;
    lastUsedAt?: Date;
  };
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    description: String,
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: Number,
    maxUses: {
      type: Number,
      required: true,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    validityPeriodMonths: Number,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    creators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    userUsage: [
      {
        userId: {
          type: String,
          required: true,
        },
        usedAt: Date,
        orderId: String,
      },
    ],
    metadata: {
      appliedCount: { type: Number, default: 0 },
      successCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      totalDiscountGiven: { type: Number, default: 0 },
      lastUsedAt: Date,
    },
  },
  { timestamps: true }
);

// Indexes for coupon operations
CouponSchema.index({ code: 1, isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1, isActive: 1 });
CouponSchema.index({ createdBy: 1, createdAt: -1 });
CouponSchema.index({ 'userUsage.userId': 1 });

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
