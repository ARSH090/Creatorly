import mongoose, { Schema, Document, Model } from 'mongoose';
import { PlanTier, BillingPeriod } from './plan.types';

export interface IPlan extends Document {
    name: string;
    description?: string;
    tier: PlanTier;
    billingPeriod: BillingPeriod[];

    // Pricing
    monthlyPrice: number;
    yearlyPrice: number;

    // Limits
    maxUsers: number;
    maxStorageMb: number;
    maxAutoDms: number;
    maxApiCalls: number;
    rateLimitPerMin: number;

    // Feature Flags
    hasAnalytics: boolean;
    hasPrioritySupport: boolean;
    hasCustomDomain: boolean;
    hasTeamCollaboration: boolean;
    hasWebhooks: boolean;

    trialLimits?: {
        maxProducts: number;
        transactionFeePercent: number;
        hasAutoDM: boolean;
    };
    displayFeatures?: string[];

    features: Array<{
        name: string;
        included: boolean;
        value?: string;
    }>;

    // Metadata
    isActive: boolean;
    isVisible: boolean;
    sortOrder: number;
    razorpayPlanId?: string; // Current Primary
    razorpayMonthlyPlanId?: string;
    razorpayYearlyPlanId?: string;
    razorpayPlanHistory: Array<{
        razorpayPlanId: string;
        cycle: 'monthly' | 'yearly';
        price: number; // in paise
        createdAt: Date;
        changedBy?: string; // admin email
    }>;
    createdAt: Date;

    updatedAt: Date;
}


const PlanSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    tier: {
        type: String,
        enum: Object.values(PlanTier),
        required: true,
        index: true
    },
    billingPeriod: [{
        type: String,
        enum: Object.values(BillingPeriod),
        required: true
    }],

    monthlyPrice: {
        type: Number,
        required: true,
        min: 0
    },
    yearlyPrice: {
        type: Number,
        required: true,
        min: 0
    },

    // Strict Limits (Free tier cannot be modified to prevent abuse)
    maxUsers: {
        type: Number,
        required: true,
        validate: {
            validator: function (this: any, val: number): boolean {
                return this.tier === PlanTier.FREE ? val <= 1 : val >= 1;
            },
            message: 'Free tier supports max 1 user.'
        }
    },
    maxStorageMb: {
        type: Number,
        required: true,
        validate: {
            validator: function (this: any, val: number): boolean {
                return this.tier === PlanTier.FREE ? val <= 100 : val >= 1024;
            },
            message: 'Free tier supports max 100MB storage.'
        }
    },
    maxAutoDms: {
        type: Number,
        required: true,
        validate: {
            validator: function (this: any, val: number): boolean {
                return this.tier === PlanTier.FREE ? val <= 100 : val >= 500;
            },
            message: 'Free tier supports max 100 Auto DMs.'
        }
    },
    maxApiCalls: {
        type: Number,
        required: true,
        validate: {
            validator: function (this: any, val: number): boolean {
                return this.tier === PlanTier.FREE ? val <= 1000 : val >= 10000;
            },
            message: 'Free tier supports max 1000 API calls.'
        }
    },
    rateLimitPerMin: { type: Number, required: true, default: 10 },

    // Feature Flags
    hasAnalytics: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (this: any, val: boolean): boolean {
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have analytics.'
        }
    },
    hasPrioritySupport: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (this: any, val: boolean): boolean {
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have priority support.'
        }
    },
    hasCustomDomain: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (this: any, val: boolean): boolean {
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have custom domains.'
        }
    },
    hasTeamCollaboration: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (this: any, val: boolean): boolean {
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have team collaboration.'
        }
    },
    hasWebhooks: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (this: any, val: boolean): boolean {
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have webhooks.'
        }
    },

    trialLimits: {
        maxProducts: { type: Number, default: 5 },
        transactionFeePercent: { type: Number, default: 3 },
        hasAutoDM: { type: Boolean, default: false }
    },
    displayFeatures: [{ type: String }],

    features: [{
        name: { type: String, required: true },
        included: { type: Boolean, default: true },
        value: { type: String }
    }],

    isActive: { type: Boolean, default: true, index: true },
    isVisible: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    razorpayPlanId: { type: String, sparse: true },
    razorpayMonthlyPlanId: { type: String, sparse: true },
    razorpayYearlyPlanId: { type: String, sparse: true },
    razorpayPlanHistory: [{
        razorpayPlanId: { type: String, required: true },
        cycle: { type: String, enum: ['monthly', 'yearly'], required: true },
        price: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
        changedBy: { type: String }
    }]
}, { timestamps: true });



// Prevent logical errors with manual pre-save hook for complex constraints
PlanSchema.pre('save', async function (this: IPlan) {
    if (this.tier === PlanTier.FREE) {
        this.monthlyPrice = 0;
        this.yearlyPrice = 0;
        this.maxUsers = 1;
        this.maxStorageMb = 100;
        this.maxAutoDms = 100;
        this.maxApiCalls = 1000;
        this.hasAnalytics = false;
        this.hasPrioritySupport = false;
        this.hasCustomDomain = false;
        this.hasTeamCollaboration = false;
        this.hasWebhooks = false;
    }
});

export const Plan = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
export default Plan;
