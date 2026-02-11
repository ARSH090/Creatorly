import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQueueJob extends Document {
    type: 'dm_delivery';
    payload: {
        recipientId: string;
        text: string;
        accessToken: string;
        creatorId: string;
        ruleId?: string;
        source: 'dm' | 'comment';
    };
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempt: number;
    maxAttempts: number;
    nextRunAt: Date;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

const QueueJobSchema: Schema = new Schema({
    type: { type: String, required: true, enum: ['dm_delivery'] },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true
    },
    attempt: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextRunAt: { type: Date, default: Date.now, index: true },
    error: { type: String },
}, { timestamps: true });

// Index for efficient polling
QueueJobSchema.index({ status: 1, nextRunAt: 1 });

export const QueueJob: Model<IQueueJob> = mongoose.models.QueueJob || mongoose.model<IQueueJob>('QueueJob', QueueJobSchema);
