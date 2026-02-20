import mongoose, { Schema, Document, Model } from 'mongoose';

export type DMProvider = 'instagram' | 'whatsapp' | 'telegram';
export type DMStatus = 'success' | 'failed' | 'rate_limited' | 'policy_violation' | 'coming_soon' | 'pending';
export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
export type TriggerSource = 'comment' | 'dm' | 'automation' | 'lead_capture';

export interface IDMLog extends Document {
    creatorId: mongoose.Types.ObjectId;
    leadId?: mongoose.Types.ObjectId;
    provider: DMProvider;
    recipientId: string;
    recipientUsername?: string;
    conversationId?: string;
    messageId?: string;
    ruleId?: mongoose.Types.ObjectId;
    serviceOfferingId?: mongoose.Types.ObjectId;
    triggerSource: TriggerSource;
    status: DMStatus;
    messageSent: string;
    lastInteractionAt: Date;
    attemptCount: number;
    errorCode?: string;
    deliveryStatus: DeliveryStatus;
    errorDetails?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const DMLogSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    provider: { type: String, enum: ['instagram', 'whatsapp', 'telegram'], default: 'instagram', required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    recipientUsername: { type: String },
    conversationId: { type: String, index: true },
    messageId: { type: String, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoReplyRule' },
    serviceOfferingId: { type: Schema.Types.ObjectId, ref: 'ServiceOffering' },
    triggerSource: { type: String, enum: ['comment', 'dm', 'automation', 'lead_capture'], default: 'lead_capture', required: true },
    status: {
        type: String,
        enum: ['success', 'failed', 'rate_limited', 'policy_violation', 'coming_soon', 'pending'],
        required: true,
        index: true
    },
    messageSent: { type: String, required: true },
    lastInteractionAt: { type: Date, required: true },
    attemptCount: { type: Number, default: 1 },
    errorCode: String,
    deliveryStatus: { type: String, enum: ['sent', 'delivered', 'read', 'failed', 'pending'], default: 'pending' },
    errorDetails: String,
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

DMLogSchema.index({ creatorId: 1, recipientId: 1, createdAt: -1 });
DMLogSchema.index({ creatorId: 1, provider: 1, status: 1 });
DMLogSchema.index({ leadId: 1 });

export const DMLog: Model<IDMLog> = mongoose.models.DMLog || mongoose.model<IDMLog>('DMLog', DMLogSchema);
