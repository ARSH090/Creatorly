import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportMessage extends Document {
    ticketId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderRole: 'user' | 'admin' | 'system';
    message: string;
    attachments: string[];
    isRead: boolean;
    createdAt: Date;
}

const supportMessageSchema = new Schema<ISupportMessage>(
    {
        ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderRole: {
            type: String,
            enum: ['user', 'admin', 'system'],
            required: true,
        },
        message: { type: String, required: true },
        attachments: [String],
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

supportMessageSchema.index({ ticketId: 1, createdAt: 1 });

const SupportMessage = mongoose.models.SupportMessage || mongoose.model<ISupportMessage>('SupportMessage', supportMessageSchema);
export default SupportMessage;
