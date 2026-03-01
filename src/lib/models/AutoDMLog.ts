import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutoDMLog extends Document {
    creatorId: mongoose.Types.ObjectId;
    ruleId?: mongoose.Types.ObjectId;
    flowId?: mongoose.Types.ObjectId;
    triggerType: 'comment' | 'dm' | 'story_reply' | 'new_follower';
    instagramUserId: string;
    instagramUsername: string;
    commentId?: string;
    postId?: string;
    commentText?: string;
    matchedKeyword: string;
    dmSent: boolean;
    dmSentAt?: Date;
    failureReason?: string;
    wasFollower: boolean;
    followGateUsed: boolean;
    messagePreview: string;
    createdAt: Date;
}

const AutoDMLogSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoDMRule' },
    flowId: { type: Schema.Types.ObjectId, ref: 'AutoDMFlow' },
    triggerType: { type: String, enum: ['comment', 'dm', 'story_reply', 'new_follower'], required: true },
    instagramUserId: { type: String, required: true },
    instagramUsername: { type: String, required: true },
    commentId: { type: String },
    postId: { type: String },
    commentText: { type: String },
    matchedKeyword: { type: String, required: true },
    dmSent: { type: Boolean, required: true, default: false },
    dmSentAt: { type: Date },
    failureReason: { type: String }, // 'not_follower' | 'daily_limit' | 'already_sent' | 'api_error'
    wasFollower: { type: Boolean, default: false },
    followGateUsed: { type: Boolean, default: false },
    messagePreview: { type: String, required: true },
}, { timestamps: true });

AutoDMLogSchema.index({ creatorId: 1, createdAt: -1 });
AutoDMLogSchema.index({ creatorId: 1, dmSent: 1 });

export const AutoDMLog: Model<IAutoDMLog> = mongoose.models.AutoDMLog || mongoose.model<IAutoDMLog>('AutoDMLog', AutoDMLogSchema);
export default AutoDMLog;
