import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
    creatorId: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    dueDate?: Date;
    status: 'Draft' | 'Active' | 'In Review' | 'Completed' | 'Cancelled';
    isArchived: boolean;
    clientViewEnabled: boolean;
    accessTokens: Array<{
        token: string;
        expiresAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    name: { type: String, required: true },
    description: String,
    dueDate: Date,
    status: {
        type: String,
        enum: ['Draft', 'Active', 'In Review', 'Completed', 'Cancelled'],
        default: 'Active',
        index: true
    },
    isArchived: { type: Boolean, default: false, index: true },
    clientViewEnabled: { type: Boolean, default: false },
    accessTokens: [{
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true }
    }]
}, { timestamps: true });

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
export { Project };
export default Project;
