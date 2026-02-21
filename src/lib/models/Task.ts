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
    dueDate?: Date;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'To Do' | 'In Progress' | 'Done';
    order: number;
    deliverables: IDeliverable[];
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
        index: true
    },
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'Done'],
        default: 'To Do',
        index: true
    },
    order: { type: Number, default: 0 },
    deliverables: [{
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        status: {
            type: String,
            enum: ['Pending', 'Uploaded', 'Sent', 'Approved'],
            default: 'Pending'
        },
        dueDate: Date,
        revisions: [{
            content: { type: String, required: true },
            date: { type: Date, default: Date.now }
        }]
    }]
}, { timestamps: true });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export { Task };
export default Task;
