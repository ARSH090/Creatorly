import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutomation extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    triggerType: 'comment' | 'click' | 'follow';
    platform: 'instagram' | 'whatsapp' | 'email';
    messageTemplate: string;
    isActive: boolean;
    rateLimitMs: number;
    logs: Array<{
        recipient: string;
        status: 'success' | 'failed' | 'rate_limited';
        error?: string;
        timestamp: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const AutomationSchema: Schema = new Schema({
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    triggerType: {
        type: String,
        enum: ['comment', 'click', 'follow'],
        required: true
    },
    platform: {
        type: String,
        enum: ['instagram', 'whatsapp', 'email'],
        required: true
    },
    messageTemplate: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    rateLimitMs: {
        type: Number,
        default: 5 * 60 * 1000 // 5 minutes default
    },
    logs: [{
        recipient: String,
        status: { type: String, enum: ['success', 'failed', 'rate_limited'] },
        error: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const Automation: Model<IAutomation> = mongoose.models.Automation || mongoose.model<IAutomation>('Automation', AutomationSchema);
export { Automation };
export default Automation;
