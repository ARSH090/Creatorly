import mongoose, { Schema, Document, Model } from 'mongoose';

// --- CourseLesson ---

export interface ICourseLesson extends Document {
    moduleId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    title: string;
    slug?: string;
    lessonType: 'video' | 'text' | 'quiz' | 'assignment';
    content: {
        videoUrl?: string;
        textContent?: string;
        quizData?: any; // JSON structure for quiz
        assignmentDetails?: string;
    };
    durationMinutes: number;
    orderIndex: number;
    isFreePreview: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CourseLessonSchema: Schema = new Schema({
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    lessonType: {
        type: String,
        enum: ['video', 'text', 'quiz', 'assignment'],
        required: true
    },
    content: {
        videoUrl: String,
        textContent: String,
        quizData: Schema.Types.Mixed,
        assignmentDetails: String
    },
    durationMinutes: { type: Number, default: 0 },
    orderIndex: { type: Number, required: true },
    isFreePreview: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Index for ordering lessons within a module
CourseLessonSchema.index({ moduleId: 1, orderIndex: 1 });


// --- CourseModule ---

export interface ICourseModule extends Document {
    productId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    orderIndex: number;
    isFreePreview: boolean; // Maybe allow whole module preview?
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CourseModuleSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    title: { type: String, required: true },
    description: String,
    orderIndex: { type: Number, required: true },
    isFreePreview: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Index for ordering modules within a product
CourseModuleSchema.index({ productId: 1, orderIndex: 1 });

const CourseLesson: Model<ICourseLesson> = mongoose.models.CourseLesson || mongoose.model<ICourseLesson>('CourseLesson', CourseLessonSchema);
const CourseModule: Model<ICourseModule> = mongoose.models.CourseModule || mongoose.model<ICourseModule>('CourseModule', CourseModuleSchema);

export { CourseLesson, CourseModule };
