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
    minimumPurchaseAmount?: number; // Alias for minOrderAmount

    usageLimit?: number;
    maxUses?: number; // Alias for usageLimit
    usedCount: number;
    usagePerUser: number;
    usageLimitPerUser?: number; // Alias
    perCustomerLimit?: number; // Alias for usagePerUser
    firstTimeOnly: boolean;

    validFrom: Date;
    validUntil?: Date;
    expiresAt?: Date; // Alias for validUntil
    status: 'active' | 'inactive' | 'expired';
    isActive: boolean; // For compatibility

    showHintOnStorefront: boolean;
    internalNote?: string;

    isBulkGenerated: boolean;
    bulkBatchId?: string;

    razorpayOfferId?: string;
    totalRevenueDriven: number;
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

    usageLimit: { type: Number, default: null },
    maxUses: Number,
    usedCount: { type: Number, default: 0 },
    usagePerUser: { type: Number, default: 0 }, // 0 means unlimited
    usageLimitPerUser: Number,
    perCustomerLimit: Number,
    firstTimeOnly: { type: Boolean, default: false },

    validFrom: { type: Date, default: Date.now },
    validUntil: Date,
    expiresAt: Date,
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    isActive: { type: Boolean, default: true },

    showHintOnStorefront: { type: Boolean, default: false },
    internalNote: String,

    isBulkGenerated: { type: Boolean, default: false },
    bulkBatchId: String,

    razorpayOfferId: String,
    totalRevenueDriven: { type: Number, default: 0 }
}, { timestamps: true });

CouponSchema.index({ creatorId: 1, code: 1 }, { unique: true });
CouponSchema.index({ creatorId: 1, createdAt: -1 });
CouponSchema.index({ creatorId: 1, isPublished: 1 });

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
export { Coupon };
export default Coupon;
