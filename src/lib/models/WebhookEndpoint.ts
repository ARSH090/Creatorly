import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEndpoint extends Document {
    creatorId: mongoose.Types.ObjectId;
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
    lastDeliveryAt?: Date;
    lastStatusCode?: number;
    createdAt: Date;
    updatedAt: Date;
}

const WebhookEndpointSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    events: { type: [String], default: [] }, // e.g. ['purchase.completed', 'refund.issued']
    secret: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    lastDeliveryAt: { type: Date },
    lastStatusCode: { type: Number },
}, { timestamps: true });

const WebhookEndpoint: Model<IWebhookEndpoint> = mongoose.models.WebhookEndpoint || mongoose.model<IWebhookEndpoint>('WebhookEndpoint', WebhookEndpointSchema);

export default WebhookEndpoint;
