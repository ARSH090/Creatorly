import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContent extends Document {
    title: string;
    body: string;
    type: 'blog' | 'twitter' | 'instagram' | 'email' | 'other';
    metadata: {
        keywords?: string[];
        tone?: string;
        targetAudience?: string;
        wordCount?: number;
    };
    creatorId: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    versionHistory: Array<{
        body: string;
        updatedBy: mongoose.Types.ObjectId;
        updatedAt: Date;
    }>;
    status: 'draft' | 'scheduled' | 'published';
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ContentSchema: Schema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
        type: String,
        enum: ['blog', 'twitter', 'instagram', 'email', 'other'],
        default: 'other'
    },
    metadata: {
        keywords: [String],
        tone: String,
        targetAudience: String,
        wordCount: Number,
    },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    versionHistory: [{
        body: String,
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'published'],
        default: 'draft'
    },
    deletedAt: { type: Date, index: true },
}, { timestamps: true });

ContentSchema.index({ title: 'text', body: 'text' });

const Content = (mongoose.models.Content as Model<IContent>) || mongoose.model<IContent>('Content', ContentSchema);

export { Content };
export default Content;
