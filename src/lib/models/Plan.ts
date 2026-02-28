import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
    id: string;
    name: string;
    description: string;
    badge: string;
    isActive: boolean;
    isHighlighted: boolean;
    displayOrder: number;
    price: number; // In paise
    previousPrice: number | null;
    priceChangedAt: Date | null;
    currency: string;
    razorpayPlanId: string | null;
    limits: {
        products: number;
        stores: number;
        emailSubscribers: number;
        emailCampaigns: number;
        autoDMAutomations: number;
        scheduledPosts: number;
        aiGenerations: number;
        analyticsRetentionDays: number;
        transactionFeePercent: number;
        customDomain: boolean;
        affiliateSystem: boolean;
        advancedAnalytics: boolean;
        autoDMHub: boolean;
        schedulify: boolean;
        emailMarketing: boolean;
        aiTools: boolean;
        prioritySupport: boolean;
        whiteLabel: boolean;
    };
    features: string[];
    createdAt: Date;
    updatedAt: Date;
}

const PlanSchema = new mongoose.Schema({
    // ── IDENTITY ──────────────────────────────────
    id: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        // 'free' | 'pro' | 'elite' | any custom id
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    badge: {
        type: String,
        default: '',
        // e.g. "Most Popular" | "Best Value" | ""
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    isHighlighted: {
        type: Boolean,
        default: false,
        // true = indigo border on pricing card
    },
    displayOrder: {
        type: Number,
        default: 0,
        // 0 = Free, 1 = Pro, 2 = Elite
    },

    // ── PRICING ───────────────────────────────────
    price: {
        type: Number,
        required: true,
        min: 0,
        // Stored in PAISE: ₹999 = 99900
        // ₹0 for free plan
    },
    previousPrice: {
        type: Number,
        default: null,
        // Stored when price changes
        // Used to show "was ₹X, now ₹Y"
    },
    priceChangedAt: {
        type: Date,
        default: null,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    razorpayPlanId: {
        type: String,
        default: null,
        // Set by admin after creating in Razorpay Dashboard
    },

    // ── FEATURE LIMITS ────────────────────────────
    limits: {
        // Numeric: -1 = unlimited
        products: { type: Number, default: 5 },
        stores: { type: Number, default: 1 },
        emailSubscribers: { type: Number, default: 100 },
        emailCampaigns: { type: Number, default: 2 },
        autoDMAutomations: { type: Number, default: 0 },
        scheduledPosts: { type: Number, default: 5 },
        aiGenerations: { type: Number, default: 10 },
        analyticsRetentionDays: { type: Number, default: 7 },
        transactionFeePercent: {
            type: Number,
            default: 5,
            min: 0,
            max: 100,
        },

        // Boolean features
        customDomain: { type: Boolean, default: false },
        affiliateSystem: { type: Boolean, default: false },
        advancedAnalytics: { type: Boolean, default: false },
        autoDMHub: { type: Boolean, default: false },
        schedulify: { type: Boolean, default: false },
        emailMarketing: { type: Boolean, default: false },
        aiTools: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        whiteLabel: { type: Boolean, default: false },
    },

    // ── DISPLAY ───────────────────────────────────
    features: [{ type: String }],
    // Human-readable list shown on pricing cards
    // Admin edits this directly
    // e.g. ["50 products", "Custom domain", "2% fee"]

}, { timestamps: true });

PlanSchema.index({ isActive: 1, displayOrder: 1 });

export const Plan = mongoose.models.Plan ||
    mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
