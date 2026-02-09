import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;

    // Applicability
    appliesTo: 'all_plans' | 'specific_plans' | 'specific_tiers';
    applicableTiers: string[];
    applicablePlanIds: mongoose.Types.ObjectId[];

    // Restrictions
    maxUses: number;
    currentUses: number;
    maxUsesPerUser: number;
    minimumPurchaseAmount: number;
    minimumPlanTier?: 'basic' | 'pro' | 'enterprise';

    // Validity
    validFrom: Date;
    validUntil: Date;

    // Logic flags
    cannotCombineWithOtherCoupons: boolean;
    excludeDiscountedItems: boolean;
    isActive: boolean;

    // Tracking
    creatorId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema: Schema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9-_]+$/, 'Invalid coupon code format'],
        index: true,
    },
    description: String,
    discountType: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (this: any, val: number): boolean {
                if (this.discountType === 'percentage') return val <= 100;
                return true;
            },
            message: 'Percentage discount cannot exceed 100%'
        }
    },
    appliesTo: {
        type: String,
        enum: ['all_plans', 'specific_plans', 'specific_tiers'],
        default: 'all_plans',
    },
    applicableTiers: [{
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise']
    }],
    applicablePlanIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Plan'
    }],
    maxUses: {
        type: Number,
        required: true,
        min: 1,
    },
    currentUses: {
        type: Number,
        default: 0,
        min: 0,
    },
    maxUsesPerUser: {
        type: Number,
        default: 1,
        min: 1,
    },
    minimumPurchaseAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    minimumPlanTier: {
        type: String,
        enum: ['basic', 'pro', 'enterprise', null],
        default: null
    },
    validFrom: {
        type: Date,
        default: Date.now,
        index: true,
    },
    validUntil: {
        type: Date,
        required: true,
        validate: {
            validator: function (this: any, val: Date): boolean {
                return val > this.validFrom;
            },
            message: 'End date must be after start date'
        }
    },
    cannotCombineWithOtherCoupons: {
        type: Boolean,
        default: true
    },
    excludeDiscountedItems: {
        type: Boolean,
        default: false
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        sparse: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, { timestamps: true });

// Logical Constraints
CouponSchema.pre('save', async function (this: ICoupon) {
    // Prevent coupons on free tier
    if (this.applicableTiers && (this.applicableTiers as any).includes('free')) {
        throw new Error('Coupons cannot apply to free tier');
    }

    // Ensure lists are populated if limited
    if (this.appliesTo === 'specific_plans' && (!this.applicablePlanIds || this.applicablePlanIds.length === 0)) {
        throw new Error('Specific plans must be selected');
    }
    if (this.appliesTo === 'specific_tiers' && (!this.applicableTiers || this.applicableTiers.length === 0)) {
        throw new Error('Specific tiers must be selected');
    }
});

// Index for query optimization
CouponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
CouponSchema.index({ code: 1, isActive: 1 });

export default (mongoose.models.Coupon as Model<ICoupon>) || mongoose.model<ICoupon>('Coupon', CouponSchema);
