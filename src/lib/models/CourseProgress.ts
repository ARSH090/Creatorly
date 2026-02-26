import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseProgress extends Document {
    userId: mongoose.Types.ObjectId;
    studentEmail: string;
    productId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    completedLessons: string[]; // Array of lesson identifiers
    lastLessonId?: string;
    lastPositionSeconds?: number;
    lastAccessedAt: Date;
    isCompleted: boolean;
    percentComplete: number;
    startedAt: Date;
    completedAt?: Date;
    certificateUrl?: string;
    notes: Array<{
        lessonId: string;
        text: string;
        updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const CourseProgressSchema = new Schema<ICourseProgress>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentEmail: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    completedLessons: [{ type: String }],
    lastLessonId: String,
    lastPositionSeconds: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: false },
    percentComplete: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    certificateUrl: String,
    notes: [{
        lessonId: String,
        text: String,
        updatedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

CourseProgressSchema.index({ userId: 1, productId: 1 }, { unique: true });
CourseProgressSchema.index({ studentEmail: 1, productId: 1 });

const CourseProgress: Model<ICourseProgress> = mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);
export { CourseProgress };
export default CourseProgress;
