import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILesson extends Document {
    moduleId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId; // Reference to the Course Product
    title: string;
    slug: string;
    description?: string;
    content?: string; // Rich text
    videoUrl?: string;
    attachments: Array<{ name: string; url: string }>;
    durationMinutes?: number;
    order: number;
    isPreview: boolean; // Accessible without purchase
    isActive: boolean;
}

export interface IModule extends Document {
    productId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    order: number;
    isActive: boolean;
}

const LessonSchema: Schema = new Schema({
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: String,
    content: String,
    videoUrl: String,
    attachments: [{
        name: String,
        url: String
    }],
    durationMinutes: Number,
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ModuleSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    description: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

LessonSchema.index({ moduleId: 1, order: 1 });
LessonSchema.index({ productId: 1 });
ModuleSchema.index({ productId: 1, order: 1 });

const Lesson = (mongoose.models.Lesson as Model<ILesson>) || mongoose.model<ILesson>('Lesson', LessonSchema);
const Module = (mongoose.models.Module as Model<IModule>) || mongoose.model<IModule>('Module', ModuleSchema);

export { Lesson, Module };
