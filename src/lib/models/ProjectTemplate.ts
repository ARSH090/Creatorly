import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectTemplate extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    category: 'Design' | 'Development' | 'Coaching' | 'Content' | 'Video' | 'Photography' | 'Marketing' | 'Consulting' | 'Other';
    description?: string;

    tasks: Array<{
        title: string;
        description?: string;
        priority: 'Low' | 'Medium' | 'High' | 'Urgent';
        relativeDueDateDays?: number; // Days after project start
        subtasks: string[];
    }>;

    milestones: Array<{
        name: string;
        relativeDueDateDays: number;
        amountPercent: number; // Percentage of project value
    }>;

    isPublic: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectTemplateSchema = new Schema<IProjectTemplate>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['Design', 'Development', 'Coaching', 'Content', 'Video', 'Photography', 'Marketing', 'Consulting', 'Other'],
        required: true
    },
    description: String,

    tasks: [{
        title: { type: String, required: true },
        description: String,
        priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
        relativeDueDateDays: Number,
        subtasks: [String]
    }],

    milestones: [{
        name: { type: String, required: true },
        relativeDueDateDays: { type: Number, required: true },
        amountPercent: { type: Number, required: true }
    }],

    isPublic: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 }
}, { timestamps: true });

const ProjectTemplate: Model<IProjectTemplate> = mongoose.models.ProjectTemplate || mongoose.model<IProjectTemplate>('ProjectTemplate', ProjectTemplateSchema);
export { ProjectTemplate };
export default ProjectTemplate;
