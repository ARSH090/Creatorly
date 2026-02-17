import mongoose, { Schema, Document } from 'mongoose';

export interface ISuspiciousAccount extends Document {
    userId: mongoose.Types.ObjectId;
    reason: string;
    matchingUserId?: mongoose.Types.ObjectId;
    matchType: 'phone' | 'device' | 'ip' | 'payment' | 'email_domain';
    actionTaken: 'flagged' | 'warned' | 'banned' | 'kyc_required';
    metadata?: {
        phoneHash?: string;
        deviceFingerprint?: string;
        ipAddress?: string;
        emailDomain?: string;
        paymentDetails?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const SuspiciousAccountSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reason: {
        type: String,
        required: true
    },
    matchingUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    matchType: {
        type: String,
        enum: ['phone', 'device', 'ip', 'payment', 'email_domain'],
        required: true,
        index: true
    },
    actionTaken: {
        type: String,
        enum: ['flagged', 'warned', 'banned', 'kyc_required'],
        required: true,
        index: true
    },
    metadata: {
        phoneHash: String,
        deviceFingerprint: String,
        ipAddress: String,
        emailDomain: String,
        paymentDetails: String
    }
}, { timestamps: true });

// Indexes for admin queries
SuspiciousAccountSchema.index({ createdAt: -1 });
SuspiciousAccountSchema.index({ actionTaken: 1, createdAt: -1 });

export const SuspiciousAccount = mongoose.models.SuspiciousAccount ||
    mongoose.model<ISuspiciousAccount>('SuspiciousAccount', SuspiciousAccountSchema);
export default SuspiciousAccount;
