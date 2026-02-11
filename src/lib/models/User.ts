import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string; // Firebase UID for authentication
    username: string;
    email: string;
    password?: string; // For internal admin auth
    displayName: string;
    bio?: string;
    avatar?: string;
    storeSlug?: string;
    razorpayContactId?: string;
    emailVerified: boolean;
    emailVerifiedAt?: Date;
    // Admin fields
    role?: 'user' | 'creator' | 'admin' | 'super-admin';
    status?: 'active' | 'suspended' | 'banned';
    permissions?: string[];
    adminApprovedAt?: Date;
    adminApprovedBy?: string;
    isSuspended?: boolean;
    suspensionReason?: string;
    suspendedAt?: Date;
    suspendedBy?: string;
    // Governance & Payouts
    payoutStatus?: 'enabled' | 'held' | 'disabled';
    payoutHoldReason?: string;
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
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
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
    emailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerifiedAt: Date,
    // Admin fields
    role: {
        type: String,
        enum: ['user', 'creator', 'admin', 'super-admin'],
        default: 'user',
        index: true,
    },
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
    }
}, { timestamps: true });




// Admin query indexes
UserSchema.index({ role: 1, isSuspended: 1 });
UserSchema.index({ adminApprovedAt: 1 });
UserSchema.index({ lastLogin: -1 });

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export { User };
export default User;
