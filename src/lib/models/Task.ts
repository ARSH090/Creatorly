import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliverable {
    name: string;
    fileUrl: string;
    status: 'Pending' | 'Uploaded' | 'Sent' | 'Approved';
    dueDate?: Date;
    revisions: Array<{
        content: string;
        date: Date;
    }>;
}

export interface ITask extends Document {
    projectId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: 'To Do' | 'In Progress' | 'In Review' | 'Done';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    dueDate?: Date;
    startDate?: Date;
    completedAt?: Date;
    isOverdue: boolean;

    assignedTo?: mongoose.Types.ObjectId;
    estimatedHours?: number;
    loggedHours: number;

    subtasks: Array<{
        text: string;
        completed: boolean;
        completedAt?: Date;
    }>;

    attachments: Array<{
        name: string;
        fileKey: string;
        uploadedAt: Date;
    }>;

    dependencies: mongoose.Types.ObjectId[]; // other task IDs

    comments: Array<{
        text: string;
        createdAt: Date;
    }>;

    position: number; // for kanban ordering
    columnId: 'todo' | 'inprogress' | 'review' | 'done';

    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true },
    description: String,
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'In Review', 'Done'],
        default: 'To Do',
        index: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
        index: true
    },
    dueDate: Date,
    startDate: Date,
    completedAt: Date,
    isOverdue: { type: Boolean, default: false },

    assignedTo: { type: Schema.Types.ObjectId, ref: 'Team' },
    estimatedHours: Number,
    loggedHours: { type: Number, default: 0 },

    subtasks: [{
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: Date
    }],

    attachments: [{
        name: { type: String, required: true },
        fileKey: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],

    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],

    comments: [{
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],

    position: { type: Number, default: 0 },
    columnId: {
        type: String,
        enum: ['todo', 'inprogress', 'review', 'done'],
        default: 'todo'
    }
}, { timestamps: true });

// Performance index
TaskSchema.index({ projectId: 1, columnId: 1, position: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export { Task };
export default Task;

