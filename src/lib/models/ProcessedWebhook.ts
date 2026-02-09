import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProcessedWebhook extends Document {
    webhookId: string;
    processedAt: Date;
    event: string;
}

const ProcessedWebhookSchema: Schema = new Schema({
    webhookId: { type: String, required: true, unique: true },
    processedAt: { type: Date, default: Date.now, expires: '30d' }, // Automatically prune old logs after 30 days
    event: { type: String, required: true },
});

const ProcessedWebhook: Model<IProcessedWebhook> = mongoose.models.ProcessedWebhook || mongoose.model<IProcessedWebhook>('ProcessedWebhook', ProcessedWebhookSchema);
export { ProcessedWebhook };
export default ProcessedWebhook;
