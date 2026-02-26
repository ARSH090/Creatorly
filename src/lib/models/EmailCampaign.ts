import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailCampaign extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    subject: string;
    content: string;
    recipients: string[]; // email addresses
    status: 'draft' | 'scheduled' | 'queued' | 'sent' | 'failed';
    scheduledAt?: Date;
    sentAt?: Date;
    stats: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        bounced: number;
        unsubscribed: number;
    };
    listId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const EmailCampaignSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    recipients: [{ type: String }],
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'queued', 'sent', 'failed'],
        default: 'draft'
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    stats: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 },
        unsubscribed: { type: Number, default: 0 }
    },
    listId: { type: Schema.Types.ObjectId, ref: 'EmailList' }
}, { timestamps: true });

EmailCampaignSchema.index({ creatorId: 1, status: 1 });

const EmailCampaign: Model<IEmailCampaign> = mongoose.models.EmailCampaign || mongoose.model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema);
export { EmailCampaign };
export default EmailCampaign;
