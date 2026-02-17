import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
    email: string;
    leadMagnetId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    downloadSent: boolean;
    downloadSentAt?: Date;
    source?: string; // utm_source, referrer, etc.
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
    leadMagnetId: {
        type: Schema.Types.ObjectId,
        ref: 'LeadMagnet',
        required: true,
        index: true,
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
}, {
    timestamps: true,
});

// Compound unique index: same email can't capture same lead magnet twice
LeadSchema.index({ email: 1, leadMagnetId: 1 }, { unique: true });

// Index for creator queries
LeadSchema.index({ creatorId: 1, createdAt: -1 });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
