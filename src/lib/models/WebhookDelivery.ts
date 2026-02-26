import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookDelivery extends Document {
    endpointId: mongoose.Types.ObjectId;
    eventType: string;
    payload: any;
    responseCode?: number;
    responseBody?: string;
    attemptCount: number;
    nextRetryAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
}

const WebhookDeliverySchema: Schema = new Schema({
    endpointId: { type: Schema.Types.ObjectId, ref: 'WebhookEndpoint', required: true, index: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    responseCode: { type: Number },
    responseBody: { type: String },
    attemptCount: { type: Number, default: 1 },
    nextRetryAt: { type: Date, index: true },
    deliveredAt: { type: Date },
}, { timestamps: true });

// Index for background worker to find pending retries
WebhookDeliverySchema.index({ nextRetryAt: 1, deliveredAt: 1 }, { partialFilterExpression: { deliveredAt: null } });

const WebhookDelivery: Model<IWebhookDelivery> = mongoose.models.WebhookDelivery || mongoose.model<IWebhookDelivery>('WebhookDelivery', WebhookDeliverySchema);

export default WebhookDelivery;
