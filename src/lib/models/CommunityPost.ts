import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityPost extends Document {
    creatorId: mongoose.Types.ObjectId;
    content: string;
    image?: string;
    likes: number;
    comments: number;
    isLocked: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityPostSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    image: { type: String },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

CommunityPostSchema.index({ creatorId: 1, createdAt: -1 });

const CommunityPost: Model<ICommunityPost> = mongoose.models.CommunityPost || mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
export { CommunityPost };
export default CommunityPost;
