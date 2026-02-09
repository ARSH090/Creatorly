import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseProgress extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    completedLessons: string[]; // Array of lesson IDs
    lastAccessedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CourseProgressSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    completedLessons: [{ type: String }],
    lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique progress per user per product
CourseProgressSchema.index({ userId: 1, productId: 1 }, { unique: true });

const CourseProgress: Model<ICourseProgress> = mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);

export default CourseProgress;
