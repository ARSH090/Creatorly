import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDownloadToken extends Document {
    token: string;
    orderId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    usageCount: number;
    maxUsage: number;
    expiresAt: Date;
    revoked: boolean;
    lastUsedAt?: Date;
    lastUsedIp?: string;
    createdAt: Date;
}

const DownloadTokenSchema: Schema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    maxUsage: {
        type: Number,
        default: 5
    },
    expiresAt: {
        type: Date,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false,
        index: true
    },
    lastUsedAt: Date,
    lastUsedIp: String
}, { timestamps: true });

// Auto-delete expired tokens
DownloadTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DownloadToken: Model<IDownloadToken> = mongoose.models.DownloadToken || mongoose.model<IDownloadToken>('DownloadToken', DownloadTokenSchema);
export { DownloadToken };
export default DownloadToken;
