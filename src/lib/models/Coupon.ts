import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;

    // Applicability
    applicableProducts: mongoose.Types.ObjectId[];
    applicableCreators: mongoose.Types.ObjectId[];

    // Limits
    usageLimit?: number;
    usagePerUser: number;
    usedCount: number;

    // Validity
    validFrom: Date;
    validUntil?: Date;

    status: 'active' | 'inactive' | 'expired';

    createdBy?: string; // Admin email
    createdAt: Date;
    updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: String,
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        min: 0
    },

    // Applicability - empty arrays mean applicable to all
    applicableProducts: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    applicableCreators: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Usage limits
    usageLimit: {
        type: Number,
        min: 1
    },
    usagePerUser: {
        type: Number,
        default: 1,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Validity
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: Date,

    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    },

    createdBy: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

// Update `updatedAt` on every save


const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
