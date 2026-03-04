import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
    creatorId: mongoose.Types.ObjectId;
    code: string; // UPPERCASE
    discountType: 'percentage' | 'fixed' | 'free' | 'bogo';
    discountValue: number; // % or amount

    bogoConfig?: {
        buyQuantity: number;
        getQuantity: number;
        getDiscountValue: number; // 100 for free
    };

    appliesTo: 'all' | 'specific' | 'type' | 'minimum';
    applicableProducts: mongoose.Types.ObjectId[];
    applicableProductIds?: mongoose.Types.ObjectId[]; // Alias
    applicableCreators?: mongoose.Types.ObjectId[];
    applicableProductType?: string;
    minOrderAmount: number;
    minimumOrderAmount?: number; // Alias for minOrderAmount
    minimumPurchaseAmount?: number; // Legacy alias

    usageLimit: number; // 0 = unlimited
    maxUses?: number; // Alias
    usageCount: number; // how many times used so far
    usedCount?: number; // Alias
    usageLimitPerUser: number; // 0 = unlimited per user
    usagePerUser?: number; // Alias
    perCustomerLimit?: number; // Alias
    firstTimeOnly: boolean;

    validFrom: Date;
    validUntil?: Date;
    expiresAt?: Date; // Alias for validUntil
    status: 'active' | 'inactive' | 'expired';
    isActive: boolean; // For compatibility

    showHintOnStorefront: boolean;
    internalNote?: string;

    maxDiscountCap?: number; // Maximum discount amount for percentage coupons
    isPublished: boolean;

    isBulkGenerated: boolean;
    bulkBatchId?: string;

    razorpayOfferId?: string;
    totalRevenueDriven: number;
    revenueGenerated?: number; // Alias
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed', 'free', 'bogo'], required: true },
    discountValue: { type: Number, required: true },
    bogoConfig: {
        buyQuantity: { type: Number, default: 1 },
        getQuantity: { type: Number, default: 1 },
        getDiscountValue: { type: Number, default: 100 }
    },


    appliesTo: { type: String, enum: ['all', 'specific', 'type', 'minimum'], default: 'all' },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableCreators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    applicableProductType: String,
    minOrderAmount: { type: Number, default: 0 },
    minimumPurchaseAmount: Number,

    usageLimit: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 }, // Alias
    usageCount: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 }, // Alias
    usageLimitPerUser: { type: Number, default: 0 },
    usagePerUser: { type: Number, default: 0 }, // Alias
    perCustomerLimit: { type: Number, default: 1 }, // Alias
    firstTimeOnly: { type: Boolean, default: false },

    validFrom: { type: Date, default: Date.now },
    validUntil: Date,
    expiresAt: Date,
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    isActive: { type: Boolean, default: true },

    showHintOnStorefront: { type: Boolean, default: false },
    internalNote: String,

    maxDiscountCap: { type: Number, default: null },
    isPublished: { type: Boolean, default: true, index: true },

    isBulkGenerated: { type: Boolean, default: false },
    bulkBatchId: String,

    razorpayOfferId: String,
    totalRevenueDriven: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 } // Alias
}, { timestamps: true });

CouponSchema.index({ creatorId: 1, code: 1 }, { unique: true });
CouponSchema.index({ creatorId: 1, createdAt: -1 });
CouponSchema.index({ creatorId: 1, isPublished: 1 });

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
export { Coupon };
export default Coupon;
