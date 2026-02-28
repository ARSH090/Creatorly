import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicket extends Document {
    ticketId: string; // Readable ID like TKT-1234
    userId: mongoose.Types.ObjectId;
    subject: string;
    status: 'open' | 'pending' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
    {
        ticketId: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        subject: { type: String, required: true },
        status: {
            type: String,
            enum: ['open', 'pending', 'resolved', 'closed'],
            default: 'open',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        category: { type: String, default: 'general' },
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ ticketId: 1 });

const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
export default SupportTicket;
