import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPendingFollower extends Document {
    creatorId: mongoose.Types.ObjectId;
    ruleId: mongoose.Types.ObjectId;
    instagramUserId: string;
    instagramUsername: string;
    commentId: string;
    postId: string;
    commentText: string;
    keyword: string;
    pendingMessage: string;
    triggeredAt: Date;
    expiresAt: Date;
    lastCheckedAt: Date;
    checkCount: number;
    status: 'pending' | 'followed' | 'expired' | 'dm_sent';
    followedAt?: Date;
    dmSentAt?: Date;
}

const PendingFollowerSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoDMRule', required: true, index: true },
    instagramUserId: { type: String, required: true },
    instagramUsername: { type: String, required: true },
    commentId: { type: String, required: true },
    postId: { type: String, required: true },
    commentText: { type: String, required: true },
    keyword: { type: String, required: true },
    pendingMessage: { type: String, required: true },
    triggeredAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    lastCheckedAt: { type: Date, required: true, default: Date.now },
    checkCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'followed', 'expired', 'dm_sent'], default: 'pending', index: true },
    followedAt: { type: Date },
    dmSentAt: { type: Date }
}, { timestamps: true });

PendingFollowerSchema.index({ status: 1, expiresAt: 1 });
PendingFollowerSchema.index({ creatorId: 1, status: 1 });
PendingFollowerSchema.index({ instagramUserId: 1, ruleId: 1 }, { unique: true });

export const PendingFollower: Model<IPendingFollower> = mongoose.models.PendingFollower || mongoose.model<IPendingFollower>('PendingFollower', PendingFollowerSchema);
export default PendingFollower;
