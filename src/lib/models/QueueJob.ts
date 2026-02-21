import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQueueJob extends Document {
    type: 'dm_delivery' | 'email_sequence_step' | 'email_broadcast' | 'booking_cleanup';
    payload: {
        // DM Payload
        recipientId?: string;
        text?: string;
        accessToken?: string;
        creatorId: string;
        ruleId?: string; // DM rule
        source?: 'dm' | 'comment' | 'story_reply' | 'new_follow';
        platform?: 'instagram' | 'whatsapp';

        // Email Payload
        sequenceId?: string;
        enrollmentId?: string;
        stepId?: string; // Index or ID
        stepIndex?: number;
        subscriberId?: string; // or subscriber email
        email?: string;
        subject?: string;
        content?: string;
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
    type: { type: String, required: true, enum: ['dm_delivery', 'email_sequence_step'] },
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
