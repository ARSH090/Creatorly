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
    razorpayContactId?: string;
    razorpayAccountId?: string; // Linked account ID for transfers

    emailVerified: boolean;
    emailVerifiedAt?: Date;
    // Admin fields
    role?: 'user' | 'creator' | 'admin' | 'super-admin' | 'affiliate';
    status?: 'active' | 'suspended' | 'banned';
    permissions?: string[];

    // Stan Store: Subscription & Billing
    plan?: 'free' | 'creator' | 'creator_pro';
    planExpiresAt?: Date;
    stripeCustomerId?: string;

    // NEW: Tier Management & Subscription
    subscriptionTier: 'free' | 'creator' | 'pro';
    subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'banned';
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
        accountId?: string;
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
    storageUsageMb?: number;

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
    planLimits?: {
        maxProducts: number;
        maxStorageMb: number;
        maxTeamMembers: number;
        maxAiGenerations: number;
        customDomain: boolean;
        canRemoveBranding: boolean;
    };
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
        unique: true,
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
    razorpayContactId: String, // For payouts
    razorpayAccountId: String, // For Razorpay Transfers

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
        enum: ['free', 'creator', 'creator_pro'],
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
        type: String,
        accountId: String,
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
    deletedAt: {
        type: Date,
        index: true
    },
    aiUsageCount: {
        type: Number,
        default: 0
    },
    storageUsageMb: {
        type: Number,
        default: 0
    },

    // Tier Management & Subscription
    subscriptionTier: {
        type: String,
        enum: ['free', 'creator', 'pro'],
        default: 'free',
        index: true
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'banned'],
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
        default: false,
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
    }
}, { timestamps: true });




// Admin query indexes
UserSchema.index({ role: 1, isSuspended: 1 });
UserSchema.index({ adminApprovedAt: 1 });
UserSchema.index({ lastLogin: -1 });

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export { User };
export default User;
