import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEventLog extends Document {
    platform: 'meta';
    eventId: string; // UNIQUE
    payloadHash: string; // Idempotency check on content
    payload: any;
    processed: boolean;
    status: 'pending' | 'processed' | 'failed' | 'skipped';
    error?: string;
    receivedAt: Date;
    processedAt?: Date;
}

const WebhookEventLogSchema: Schema = new Schema({
    platform: { type: String, default: 'meta', required: true },
    eventId: { type: String, required: true, unique: true, index: true },
    payloadHash: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['pending', 'processed', 'failed', 'skipped'], default: 'pending' },
    error: String,
    receivedAt: { type: Date, default: Date.now },
    processedAt: Date
}, { timestamps: true });

WebhookEventLogSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // Keep for 30 days for audit

export const WebhookEventLog: Model<IWebhookEventLog> = mongoose.models.WebhookEventLog || mongoose.model<IWebhookEventLog>('WebhookEventLog', WebhookEventLogSchema);
