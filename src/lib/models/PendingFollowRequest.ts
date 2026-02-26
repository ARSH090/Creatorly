import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPendingFollowRequest extends Document {
    creatorId: mongoose.Types.ObjectId;
    platform: 'instagram' | 'whatsapp';
    recipientId: string; // Instagram/WhatsApp ID
    recipientUsername?: string;
    igUserId?: string; // Creator's IG User ID
    ruleId: mongoose.Types.ObjectId;
    triggerType: string;
    requestedContent: string; // The message to send once they follow
    followFirstMessageSent: boolean;
    status: 'waiting_follow' | 'completed' | 'expired' | 'waiting';
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PendingFollowRequestSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'whatsapp'], required: true },
    recipientId: { type: String, required: true, index: true },
    recipientUsername: { type: String },
    igUserId: { type: String },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoReplyRule', required: true },
    triggerType: { type: String },
    requestedContent: { type: String, required: true },
    followFirstMessageSent: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['waiting_follow', 'completed', 'expired', 'waiting'],
        default: 'waiting_follow',
        index: true
    },
    expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

// Compound index for matching new follows
PendingFollowRequestSchema.index({ creatorId: 1, recipientId: 1, status: 1 });

export const PendingFollowRequest: Model<IPendingFollowRequest> =
    mongoose.models.PendingFollowRequest ||
    mongoose.model<IPendingFollowRequest>('PendingFollowRequest', PendingFollowRequestSchema);

export default PendingFollowRequest;
