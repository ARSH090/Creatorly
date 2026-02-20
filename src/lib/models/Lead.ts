import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
    email: string;
    name?: string;
    phone?: string;
    interest?: string;
    leadMagnetId?: mongoose.Types.ObjectId;
    creatorId?: mongoose.Types.ObjectId;
    downloadSent: boolean;
    downloadSentAt?: Date;
    source?: string;
    referredBy?: string;
    // DM Fields
    dmStatus?: 'pending' | 'sent' | 'failed' | 'none';
    dmProvider?: 'instagram' | 'whatsapp';
    dmSentAt?: Date;
    dmError?: string;
    dmMessageId?: string;
    dmRecipientId?: string;
    dmAttempts?: number;
    createdAt: Date;
    updatedAt: Date;
}

const LeadSchema = new Schema<ILead>({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    name: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    interest: {
        type: String,
        trim: true,
    },
    leadMagnetId: {
        type: Schema.Types.ObjectId,
        ref: 'LeadMagnet',
        required: false,
        index: true,
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true,
    },
    downloadSent: {
        type: Boolean,
        default: false,
    },
    downloadSentAt: {
        type: Date,
    },
    source: {
        type: String,
        default: '',
    },
    referredBy: {
        type: String,
        index: true,
    },
    // DM Fields
    dmStatus: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'none'],
        default: 'none',
    },
    dmProvider: {
        type: String,
        enum: ['instagram', 'whatsapp'],
    },
    dmSentAt: {
        type: Date,
    },
    dmError: {
        type: String,
    },
    dmMessageId: {
        type: String,
    },
    dmRecipientId: {
        type: String,
    },
    dmAttempts: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes
LeadSchema.index({ email: 1, createdAt: -1 });
LeadSchema.index({ creatorId: 1, createdAt: -1 });
LeadSchema.index({ dmStatus: 1 });
LeadSchema.index({ creatorId: 1, dmStatus: 1 });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
