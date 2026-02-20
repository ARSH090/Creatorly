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
    source?: string; // utm_source, referrer, etc.
    referredBy?: string;
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
        required: false, // Optional for AutoDM general leads
        index: true,
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Optional if we don't have a creator context yet
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
}, {
    timestamps: true,
});

// Remove unique index on email/leadMagnetId if it existed, 
// or keep it for lead magnets but allow general leads.
// Actually, for AutoDM, a user might express interest in multiple things.
// LeadSchema.index({ email: 1, leadMagnetId: 1 }, { unique: true });

// Index for general queries
LeadSchema.index({ email: 1, createdAt: -1 });
LeadSchema.index({ creatorId: 1, createdAt: -1 });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
