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
    maxApiCalls: number;
    rateLimitPerMin: number;

    // Feature Flags
    hasAnalytics: boolean;
    hasPrioritySupport: boolean;
    hasCustomDomain: boolean;
    hasTeamCollaboration: boolean;
    hasWebhooks: boolean;

    // Metadata
    isActive: boolean;
    isVisible: boolean;
    sortOrder: number;
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
        min: 0,
        validate: {
            validator: function (val: number) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val === 0 : val > 0;
            },
            message: 'Monthly price must be 0 for Free tier and > 0 for paid tiers.'
        }
    },
    yearlyPrice: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (val: number) {
                // @ts-ignore
                if (this.tier === PlanTier.FREE) return val === 0;
                // @ts-ignore
                return val > 0 && val < this.monthlyPrice * 12;
            },
            message: 'Yearly price must be 0 for Free tier and less than monthly * 12 for paid tiers.'
        }
    },

    // Strict Limits (Free tier cannot be modified to prevent abuse)
    maxUsers: {
        type: Number,
        required: true,
        validate: {
            validator: function (val: number) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val <= 1 : val >= 1;
            },
            message: 'Free tier supports max 1 user.'
        }
    },
    maxStorageMb: {
        type: Number,
        required: true,
        validate: {
            validator: function (val: number) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val <= 100 : val >= 1024;
            },
            message: 'Free tier supports max 100MB storage.'
        }
    },
    maxApiCalls: {
        type: Number,
        required: true,
        validate: {
            validator: function (val: number) {
                // @ts-ignore
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
            validator: function (val: boolean) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have analytics.'
        }
    },
    hasPrioritySupport: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (val: boolean) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have priority support.'
        }
    },
    hasCustomDomain: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (val: boolean) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have custom domains.'
        }
    },
    hasTeamCollaboration: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (val: boolean) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have team collaboration.'
        }
    },
    hasWebhooks: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (val: boolean) {
                // @ts-ignore
                return this.tier === PlanTier.FREE ? val === false : true;
            },
            message: 'Free tier cannot have webhooks.'
        }
    },

    isActive: { type: Boolean, default: true, index: true },
    isVisible: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

// Prevent logical errors with manual pre-save hook for complex constraints
PlanSchema.pre('save', function (next) {
    if (this.tier === PlanTier.FREE) {
        this.monthlyPrice = 0;
        this.yearlyPrice = 0;
        this.maxUsers = 1;
        this.maxStorageMb = 100;
        this.maxApiCalls = 1000;
        this.hasAnalytics = false;
        this.hasPrioritySupport = false;
        this.hasCustomDomain = false;
        this.hasTeamCollaboration = false;
        this.hasWebhooks = false;
    }
    next();
});

export const Plan = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
export default Plan;
