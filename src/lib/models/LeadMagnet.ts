import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadMagnet extends Document {
    title: string;
    description: string;
    fileUrl: string; // S3 URL for the free download
    fileKey: string; // S3 key for file management
    creatorId: mongoose.Types.ObjectId;
    isActive: boolean;
    downloadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const LeadMagnetSchema = new Schema<ILeadMagnet>({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    fileUrl: {
        type: String,
        required: true,
    },
    fileKey: {
        type: String,
        required: true,
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    downloadCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Index for efficient creator queries
LeadMagnetSchema.index({ creatorId: 1, isActive: 1 });

export default mongoose.models.LeadMagnet || mongoose.model<ILeadMagnet>('LeadMagnet', LeadMagnetSchema);
