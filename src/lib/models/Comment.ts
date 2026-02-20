import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
    postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    content: string;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    likes: { type: Number, default: 0 }
}, { timestamps: true });

// Optimize for fetching comments by post (showing newest first usually, or oldest?)
CommentSchema.index({ postId: 1, createdAt: 1 });

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
export { Comment };
export default Comment;
