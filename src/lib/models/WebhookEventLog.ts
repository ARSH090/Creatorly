import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEventLog extends Document {
    platform: 'meta';
    eventId: string;
    payload: any;
    processed: boolean;
    error?: string;
    receivedAt: Date;
}

const WebhookEventLogSchema: Schema = new Schema({
    platform: { type: String, default: 'meta', required: true },
    eventId: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false },
    error: String,
    receivedAt: { type: Date, default: Date.now }
}, { timestamps: true });

WebhookEventLogSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // Keep for 7 days

export const WebhookEventLog: Model<IWebhookEventLog> = mongoose.models.WebhookEventLog || mongoose.model<IWebhookEventLog>('WebhookEventLog', WebhookEventLogSchema);
