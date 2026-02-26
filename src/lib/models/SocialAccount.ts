import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISocialAccount extends Document {
    userId: mongoose.Types.ObjectId;
    platform: 'instagram' | 'facebook';
    pageId: string;
    instagramBusinessId: string;
    /**
     * Encrypted page access token (AES-256-GCM ciphertext)
     */
    pageAccessToken: string;
    /**
     * AES-GCM IV (hex)
     */
    tokenIV: string;
    /**
     * AES-GCM authentication tag (hex)
     *
     * NOTE: Added for stronger token encryption. Existing documents without this
     * field will be treated as legacy and should be rotated.
     */
    tokenTag: string;
    tokenExpiresAt?: Date;
    tokenStatus: 'valid' | 'expired' | 'revoked';
    keyVersion: string;
    lastTokenCheck: Date;

    isBusiness: boolean;
    webhookSubscribed: boolean;
    isActive: boolean;
    connectedAt: Date;
    metadata?: Record<string, any>;
}

const SocialAccountSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'facebook'], default: 'instagram', required: true },
    pageId: { type: String, required: true },
    instagramBusinessId: { type: String, required: true, unique: true, index: true },
    pageAccessToken: { type: String, required: true },
    tokenIV: { type: String, required: true }, // IV must be provided
    tokenTag: { type: String, required: true }, // GCM Tag must be provided

    tokenExpiresAt: Date,
    tokenStatus: { type: String, enum: ['valid', 'expired', 'revoked'], default: 'valid', index: true },
    keyVersion: { type: String, default: 'v1' }, // tracks which encryption key was used
    lastTokenCheck: { type: Date, default: Date.now },

    isBusiness: { type: Boolean, default: false },
    webhookSubscribed: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

SocialAccountSchema.index({ userId: 1, platform: 1 });

export const SocialAccount: Model<ISocialAccount> = mongoose.models.SocialAccount || mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema);
