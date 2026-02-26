import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
    creatorId: mongoose.Types.ObjectId;
    projectNumber: string;       // PRJ-001234
    name: string;
    clientId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    linkedOrderId?: mongoose.Types.ObjectId;

    category?: 'Design' | 'Development' | 'Coaching' | 'Content' | 'Video' | 'Photography' | 'Marketing' | 'Consulting' | 'Other';
    description?: string;
    coverImage?: string;
    tags: string[];

    clientEmail: string;
    clientName: string;
    clientPhone?: string;
    clientCompany?: string;
    clientPortalToken: string;

    startDate: Date;
    dueDate?: Date;
    completedAt?: Date;
    archivedAt?: Date;
    isArchived: boolean;

    status: 'Not Started' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold' | 'Cancelled';
    paymentStatus: 'Unpaid' | 'Deposit Paid' | 'Fully Paid' | 'Invoice Sent';

    value: number; // in paise
    estimatedHours?: number;
    loggedHours: number;

    milestones: Array<{
        name: string;
        dueDate: Date;
        amount: number;
        status: 'pending' | 'completed' | 'invoiced';
        completedAt?: Date;
    }>;

    health: {
        score: number;
        lastCalculatedAt: Date;
    };

    internalNotes?: string;
    activityLog: Array<{
        action: string;
        performedBy: string;
        timestamp: Date;
        meta?: any;
    }>;

    templateId?: mongoose.Types.ObjectId;
    notificationSettings: {
        taskOverdueEmail: boolean;
        dueDateApproachEmail: boolean;
        clientApprovalPush: boolean;
    };

    messages: Array<{
        sender: 'Creator' | 'Client' | 'System';
        content: string;
        timestamp: Date;
        attachments?: string[];
        type?: 'text' | 'file' | 'status_change';
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectNumber: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    linkedOrderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },

    category: {
        type: String,
        enum: ['Design', 'Development', 'Coaching', 'Content', 'Video', 'Photography', 'Marketing', 'Consulting', 'Other'],
        default: 'Other'
    },
    description: String,
    coverImage: String,
    tags: [{ type: String }],

    clientEmail: { type: String, required: true },
    clientName: { type: String, required: true },
    clientPhone: String,
    clientCompany: String,
    clientPortalToken: { type: String, required: true, unique: true, index: true },

    startDate: { type: Date, default: Date.now },
    dueDate: Date,
    completedAt: Date,
    archivedAt: Date,
    isArchived: { type: Boolean, default: false, index: true },

    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'],
        default: 'Not Started',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Deposit Paid', 'Fully Paid', 'Invoice Sent'],
        default: 'Unpaid'
    },

    value: { type: Number, default: 0 },
    estimatedHours: Number,
    loggedHours: { type: Number, default: 0 },

    milestones: [{
        name: { type: String, required: true },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'completed', 'invoiced'], default: 'pending' },
        completedAt: Date
    }],

    health: {
        score: { type: Number, default: 100 },
        lastCalculatedAt: { type: Date, default: Date.now }
    },

    internalNotes: String,
    activityLog: [{
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        meta: Schema.Types.Mixed
    }],

    templateId: { type: Schema.Types.ObjectId, ref: 'ProjectTemplate' },
    notificationSettings: {
        taskOverdueEmail: { type: Boolean, default: true },
        dueDateApproachEmail: { type: Boolean, default: true },
        clientApprovalPush: { type: Boolean, default: true }
    },
    messages: [{
        sender: { type: String, enum: ['Creator', 'Client', 'System'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        attachments: [{ type: String }],
        type: { type: String, default: 'text' }
    }]
}, { timestamps: true });

// Indexes for performance
ProjectSchema.index({ creatorId: 1, status: 1, dueDate: 1 });
ProjectSchema.index({ creatorId: 1, isArchived: 1, createdAt: -1 });

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export { Project };

export default Project;

