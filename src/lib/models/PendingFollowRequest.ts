import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPendingFollowRequest extends Document {
    creatorId: mongoose.Types.ObjectId;
    platform: 'instagram' | 'whatsapp';
    recipientId: string; // Instagram/WhatsApp ID
    recipientUsername?: string;
    ruleId: mongoose.Types.ObjectId;
    requestedType: 'product' | 'pdf' | 'booking' | 'custom';
    requestedId?: string;
    messageText: string; // The message to send once they follow
    status: 'waiting' | 'completed' | 'expired';
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PendingFollowRequestSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'whatsapp'], required: true },
    recipientId: { type: String, required: true, index: true },
    recipientUsername: { type: String },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoReplyRule', required: true },
    requestedType: { type: String, enum: ['product', 'pdf', 'booking', 'custom'], required: true },
    requestedId: { type: String },
    messageText: { type: String, required: true },
    status: {
        type: String,
        enum: ['waiting', 'completed', 'expired'],
        default: 'waiting',
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
