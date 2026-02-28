import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    clerkId?: string; // Clerk User ID
    firebaseUid?: string; // Firebase UID (Deprecated)
    username: string;
    email: string;
    password?: string; // For internal admin auth
    displayName: string;
    bio?: string;
    avatar?: string;
    storeSlug?: string;
    phone?: string;
    razorpayContactId?: string;
    razorpayAccountId?: string; // Linked account ID for transfers
    razorpayCustomerId?: string; // Razorpay Customer ID for Subscriptions

    emailVerified: boolean;
    emailVerifiedAt?: Date;
    // Admin fields
    role?: 'user' | 'creator' | 'admin' | 'super-admin' | 'affiliate';
    status?: 'active' | 'suspended' | 'banned';
    permissions?: string[];

    // Stan Store: Subscription & Billing
    // Stan Store: Subscription & Billing
    plan?: 'free' | 'starter' | 'pro' | 'business';
    planExpiresAt?: Date;
    stripeCustomerId?: string;

    // NEW: Tier Management & Subscription
    subscriptionTier: 'free' | 'starter' | 'pro' | 'business';
    subscriptionStatus: 'active' | 'trialing' | 'expired' | 'cancelled' | 'banned';
    subscriptionStartAt?: Date;
    subscriptionEndAt?: Date;
    razorpaySubscriptionId?: string;
    adminApprovedAt?: Date;
    adminApprovedBy?: string;
    isSuspended?: boolean;
    suspensionReason?: string;
    suspendedAt?: Date;
    suspendedBy?: string;
    // Governance & Payouts
    payoutStatus?: 'enabled' | 'held' | 'disabled';
    payoutHoldReason?: string;
    payoutMethod?: {
        type: 'stripe' | 'paypal' | 'bank';
        /**
         * Encrypted account ID/Number (AES-256-GCM ciphertext)
         */
        accountId?: string;
        /**
         * AES-GCM IV and Tag for accountId encryption
         */
        accountIV?: string;
        accountTag?: string;
        email?: string;
    };
    suspensionHistory?: Array<{
        status: string;
        reason: string;
        date: Date;
        adminId: string;
    }>;
    // 2FA
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    lastLogin?: Date;
    storeStatus: 'active' | 'suspended' | 'pending';
    storeSuspensionReason?: string;
    adminNotes?: string;
    lastLoginIp?: string;
    loginHistory?: Array<{
        ip: string;
        userAgent?: string;
        timestamp: Date;
        successful: boolean;
    }>;
    failedLoginAttempts?: number;
    lastFailedLoginAt?: Date;
    activeSubscription?: any; // Populated field
    deletedAt?: Date; // Soft-delete support
    aiUsageCount: number;
    aiCredits?: number;
    storageUsageMb?: number;
    name?: string; // Legacy support

    // Password Reset
    passwordResetToken?: string; // SHA256 hash of reset token
    passwordResetExpiry?: Date;
    passwordChangeHistory?: Array<{
        changedAt: Date;
        resetViaEmail: boolean;
    }>;

    // NEW: Anti-Abuse & Phone Verification
    phoneHash?: string; // SHA256 of phone number
    phoneVerified: boolean;
    phoneVerifiedAt?: Date;
    phoneLastChangedAt?: Date;
    deviceFingerprint?: string;
    signupIp: string;
    signupCountry?: string;

    // NEW: Monotonic Counters (NEVER Decrement)
    freeTierOrdersCount: number;
    freeTierLeadsCount: number;

    // NEW: Abuse Detection
    isFlagged: boolean;
    flagReason?: string;
    flaggedAt?: Date;
    kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
    trialUsed: boolean;
    onboardingComplete: boolean;
    onboardingStep: number;

    // WhatsApp Configuration
    whatsappConfig?: {
        phoneNumberId?: string; // Encrypted
        phoneNumberIdIV?: string;
        phoneNumberIdTag?: string;
        accessToken?: string;   // Encrypted
        accessTokenIV?: string;
        accessTokenTag?: string;
        businessAccountId?: string;
        displayName?: string;
        status: 'connected' | 'disconnected' | 'error';
        connectedAt?: Date;
    };

    planLimits?: {
        maxProducts: number;
        maxStorageMb: number;
        maxTeamMembers: number;
        maxAiGenerations: number;
        customDomain: boolean;
        canRemoveBranding: boolean;
    };

    // NEW: Payment Settings (Multi-provider)
    paymentConfigs?: {
        upi?: { upiId: string; active: boolean };
        razorpay?: { keyId: string; keySecret?: string; keySecretIV?: string; keySecretTag?: string; active: boolean };
        stripe?: { accountId: string; active: boolean };
        paypal?: { email: string; active: boolean };
        bank?: {
            accountNumber?: string; accountNumberIV?: string; accountNumberTag?: string;
            ifsc: string; holderName: string; bankName: string; active: boolean
        };
    };
    primaryPaymentMethod?: 'upi' | 'razorpay' | 'stripe' | 'paypal' | 'bank';

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}




const UserSchema: Schema = new Schema({
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    firebaseUid: {
        type: String,
        sparse: true,
        index: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    bio: String,
    avatar: String,
    storeSlug: {
        type: String,
        unique: true,
        sparse: true,
    },
    phone: String,
    razorpayContactId: String, // For payouts
    razorpayAccountId: String, // For Razorpay Transfers
    razorpayCustomerId: {
        type: String,
        sparse: true,
        index: true
    },

    emailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerifiedAt: Date,
    // Admin fields
    role: {
        type: String,
        enum: ['user', 'creator', 'admin', 'super-admin', 'affiliate'],
        default: 'user',
        index: true,
    },
    plan: {
        type: String,
        enum: ['free', 'starter', 'pro', 'business'],
        default: 'free',
        index: true,
    },
    planExpiresAt: Date,
    stripeCustomerId: String,
    status: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active',
        index: true,
    },
    permissions: [String],
    adminApprovedAt: Date,
    adminApprovedBy: String,
    isSuspended: {
        type: Boolean,
        default: false,
        index: true,
    },
    suspensionReason: String,
    suspendedAt: Date,
    suspendedBy: String,
    // Governance & Payouts
    payoutStatus: {
        type: String,
        enum: ['enabled', 'held', 'disabled'],
        default: 'enabled',
        index: true
    },
    payoutHoldReason: String,
    payoutMethod: {
        type: { type: String, enum: ['stripe', 'paypal', 'bank'], default: 'bank' },
        accountId: String,
        accountIV: String,
        accountTag: String,
        email: String
    },
    suspensionHistory: [{
        status: String,
        reason: String,
        date: { type: Date, default: Date.now },
        adminId: String
    }],
    // 2FA
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],
    lastLogin: Date,
    lastLoginIp: String,
    loginHistory: [
        {
            ip: String,
            userAgent: String,
            timestamp: { type: Date, default: Date.now },
            successful: { type: Boolean, default: true },
        },
    ],
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    lastFailedLoginAt: Date,
    password: String, // For internal admin auth / custom auth
    deletedAt: {
        type: Date,
        index: true
    },
    storageUsageMb: {
        type: Number,
        default: 0
    },
    aiUsageCount: {
        type: Number,
        default: 0
    },

    // Password Reset
    passwordResetToken: String, // SHA256 hash
    passwordResetExpiry: Date,
    passwordChangeHistory: [{
        changedAt: Date,
        resetViaEmail: Boolean,
    }],

    // Security & Limits Enforced at User Level
    planLimits: {
        maxProducts: { type: Number, default: 3 },
        maxStorageMb: { type: Number, default: 100 },
        maxTeamMembers: { type: Number, default: 1 },
        maxAiGenerations: { type: Number, default: 10 },
        customDomain: { type: Boolean, default: false },
        canRemoveBranding: { type: Boolean, default: false },
    },
    verifiedDevices: [{
        type: Schema.Types.ObjectId,
        ref: 'Device'
    }],
    activeSubscription: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription'
    },

    // Tier Management & Subscription
    subscriptionTier: {
        type: String,
        enum: ['free', 'starter', 'pro', 'business'],
        default: 'free',
        index: true
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'trialing', 'expired', 'cancelled', 'banned'],
        default: 'active',
        index: true
    },
    subscriptionStartAt: Date,
    subscriptionEndAt: Date,
    razorpaySubscriptionId: {
        type: String,
        sparse: true,
        unique: true
    },

    // Anti-Abuse & Phone Verification
    phoneHash: {
        type: String,
        sparse: true,
        unique: true,
        index: true
    },
    phoneVerified: {
        type: Boolean,
        default: true, // Auto-verified as we removed the step
        index: true
    },
    phoneVerifiedAt: Date,
    phoneLastChangedAt: Date,
    deviceFingerprint: {
        type: String,
        index: true
    },
    signupIp: {
        type: String,
        required: false, // Will be made required for new registrations
        index: true
    },
    signupCountry: String,

    // Monotonic Counters (NEVER decrement)
    freeTierOrdersCount: {
        type: Number,
        default: 0,
        min: 0
    },
    freeTierLeadsCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Abuse Detection
    isFlagged: {
        type: Boolean,
        default: false,
        index: true
    },
    flagReason: String,
    flaggedAt: Date,
    kycStatus: {
        type: String,
        enum: ['none', 'pending', 'verified', 'rejected'],
        default: 'none',
        index: true
    },
    trialUsed: {
        type: Boolean,
        default: false
    },
    onboardingComplete: {
        type: Boolean,
        default: false,
        index: true
    },
    onboardingStep: {
        type: Number,
        default: 1
    },
    whatsappConfig: {
        phoneNumberId: String,
        phoneNumberIdIV: String,
        phoneNumberIdTag: String,
        accessToken: String,
        accessTokenIV: String,
        accessTokenTag: String,
        businessAccountId: String,
        displayName: String,
        status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
        connectedAt: Date
    },

    // NEW: Payment Settings (Multi-provider)
    paymentConfigs: {
        upi: { upiId: String, active: { type: Boolean, default: false } },
        razorpay: {
            keyId: String,
            keySecret: String,
            keySecretIV: String,
            keySecretTag: String,
            active: { type: Boolean, default: false }
        },
        stripe: { accountId: String, active: { type: Boolean, default: false } },
        paypal: { email: String, active: { type: Boolean, default: false } },
        bank: {
            accountNumber: String,
            accountNumberIV: String,
            accountNumberTag: String,
            ifsc: String,
            holderName: String,
            bankName: String,
            active: { type: Boolean, default: false }
        }
    },
    primaryPaymentMethod: {
        type: String,
        enum: ['upi', 'razorpay', 'stripe', 'paypal', 'bank'],
        default: 'upi'
    },

    // Price locked at subscription time (Grandfathering support)
    lockedPlanPrice: {
        type: Number,
        default: null,
    },
    lockedPlanPriceAt: {
        type: Date,
        default: null,
    },
    storeStatus: {
        type: String,
        enum: ['active', 'suspended', 'pending'],
        default: 'active'
    },
    storeSuspensionReason: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
}, { timestamps: true });




// Generic performance indexes
UserSchema.index({ creatorId: 1, createdAt: -1 });
UserSchema.index({ creatorId: 1, isPublished: 1 }); // Mapping for potential isPublished usage

// Admin query indexes
UserSchema.index({ role: 1, isSuspended: 1 });
UserSchema.index({ adminApprovedAt: 1 });
UserSchema.index({ lastLogin: -1 });

// ─── Performance indexes ──────────────────────────────────────────────────────
// Fast Clerk session → MongoDB user lookup (every authenticated API call)
// (Index defined inline in schema)
// Fast storefront lookup (used in every /u/[username] request)
// (Index defined inline in schema)
// (Index defined inline in schema)
// Admin/ops filtering
UserSchema.index({ status: 1, subscriptionTier: 1 });
// Cron: find users whose trial expires soon
UserSchema.index({ subscriptionStatus: 1, subscriptionEndAt: 1 });

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export { User };
export default User;
