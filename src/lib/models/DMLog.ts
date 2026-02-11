import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDMLog extends Document {
    creatorId: mongoose.Types.ObjectId;
    recipientId: string;
    conversationId?: string; // ManyChat level tracking
    messageId?: string; // Meta message ID
    ruleId?: mongoose.Types.ObjectId;
    triggerSource: 'comment' | 'dm';
    status: 'success' | 'failed' | 'rate_limited' | 'policy_violation';
    messageSent: string;
    lastInteractionAt: Date;
    attemptCount: number;
    errorCode?: string;
    deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
    errorDetails?: string;
    metadata?: Record<string, any>;
}

const DMLogSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    conversationId: { type: String, index: true },
    messageId: { type: String, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoReplyRule' },
    triggerSource: { type: String, enum: ['comment', 'dm'], required: true },
    status: { type: String, enum: ['success', 'failed', 'rate_limited', 'policy_violation'], required: true, index: true },
    messageSent: { type: String, required: true },
    lastInteractionAt: { type: Date, required: true },
    attemptCount: { type: Number, default: 1 },
    errorCode: String,
    deliveryStatus: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
    errorDetails: String,
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

DMLogSchema.index({ creatorId: 1, recipientId: 1, createdAt: -1 });

export const DMLog: Model<IDMLog> = mongoose.models.DMLog || mongoose.model<IDMLog>('DMLog', DMLogSchema);
