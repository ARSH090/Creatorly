import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDownloadToken extends Document {
    token: string;
    orderId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    downloadCount: number; // renamed from usageCount
    maxDownloads: number; // renamed from maxUsage
    expiresAt: Date;
    isActive: boolean; // renamed from revoked (inverted)
    lastDownloadedAt?: Date; // renamed from lastUsedAt
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
    downloadCount: {
        type: Number,
        default: 0
    },
    maxDownloads: {
        type: Number,
        default: 3
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastDownloadedAt: Date,
    lastUsedIp: String
}, { timestamps: true });

// Auto-delete expired tokens
DownloadTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DownloadToken: Model<IDownloadToken> = mongoose.models.DownloadToken || mongoose.model<IDownloadToken>('DownloadToken', DownloadTokenSchema);
export { DownloadToken };
export default DownloadToken;
