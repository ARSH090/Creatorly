import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectMessage extends Document {
    projectId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    senderType: 'creator' | 'client';
    senderName: string;
    content: string;
    attachments: Array<{
        name: string;
        fileKey: string;
        fileSize: number;
    }>;
    replyToMessageId?: mongoose.Types.ObjectId;
    readByCreator: boolean;
    readByClient: boolean;
    reactions: Array<{
        emoji: string;
        by: string;
    }>;
    pinnedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectMessageSchema = new Schema<IProjectMessage>({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderType: { type: String, enum: ['creator', 'client'], required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [{
        name: { type: String, required: true },
        fileKey: { type: String, required: true },
        fileSize: { type: Number, required: true }
    }],
    replyToMessageId: { type: Schema.Types.ObjectId, ref: 'ProjectMessage' },
    readByCreator: { type: Boolean, default: false },
    readByClient: { type: Boolean, default: false },
    reactions: [{
        emoji: { type: String, required: true },
        by: { type: String, required: true }
    }],
    pinnedAt: Date
}, { timestamps: true });

ProjectMessageSchema.index({ projectId: 1, createdAt: -1 });

const ProjectMessage: Model<IProjectMessage> = mongoose.models.ProjectMessage || mongoose.model<IProjectMessage>('ProjectMessage', ProjectMessageSchema);
export { ProjectMessage };
export default ProjectMessage;
