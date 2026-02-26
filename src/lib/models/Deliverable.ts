import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliverable extends Document {
    projectId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    fileKey: string;
    fileSize: number;
    fileType: string;
    thumbnailKey?: string;

    versionNumber: number;
    previousVersions: Array<{
        fileKey: string;
        versionNumber: number;
        uploadedAt: Date;
    }>;

    status: 'Pending' | 'Awaiting Approval' | 'Approved' | 'Revision Requested' | 'Internal Review';
    approvalToken?: string;
    approvedAt?: Date;

    revisionNotes?: string;
    revisionCount: number;

    comments: Array<{
        sender: 'Creator' | 'Client';
        content: string;
        timestamp: Date;
    }>;

    sentToClientAt?: Date;

    viewedByClientAt?: Date;

    linkedTaskId?: mongoose.Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const DeliverableSchema = new Schema<IDeliverable>({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    fileKey: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    thumbnailKey: String,

    versionNumber: { type: Number, default: 1 },
    previousVersions: [{
        fileKey: { type: String, required: true },
        versionNumber: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],

    status: {
        type: String,
        enum: ['Pending', 'Awaiting Approval', 'Approved', 'Revision Requested', 'Internal Review'],
        default: 'Pending',
        index: true
    },
    approvalToken: String,
    approvedAt: Date,

    revisionNotes: String,
    revisionCount: { type: Number, default: 0 },

    comments: [{
        sender: { type: String, enum: ['Creator', 'Client'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],

    sentToClientAt: Date,
    viewedByClientAt: Date,

    linkedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

DeliverableSchema.index({ projectId: 1, versionNumber: -1 });

const Deliverable: Model<IDeliverable> = mongoose.models.Deliverable || mongoose.model<IDeliverable>('Deliverable', DeliverableSchema);
export { Deliverable };
export default Deliverable;
