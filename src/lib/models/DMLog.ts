import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDMLog extends Document {
    creatorId: mongoose.Types.ObjectId;
    recipientId: string; // IG Scoped ID
    ruleId?: mongoose.Types.ObjectId;
    triggerType: 'comment' | 'dm';
    status: 'success' | 'failed' | 'rate_limited';
    messageSent: string;
    errorDetails?: string;
    metadata?: Record<string, any>;
}

const DMLogSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoReplyRule' },
    triggerType: { type: String, enum: ['comment', 'dm'], required: true },
    status: { type: String, enum: ['success', 'failed', 'rate_limited'], required: true, index: true },
    messageSent: { type: String, required: true },
    errorDetails: String,
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

DMLogSchema.index({ creatorId: 1, createdAt: -1 });

export const DMLog: Model<IDMLog> = mongoose.models.DMLog || mongoose.model<IDMLog>('DMLog', DMLogSchema);
