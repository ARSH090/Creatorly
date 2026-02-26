import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowEnrollment extends Document {
    workflowId: mongoose.Types.ObjectId;
    subscriberId: mongoose.Types.ObjectId;
    currentStepIndex: number;
    nextSendAt: Date;
    status: 'active' | 'completed' | 'unsubscribed' | 'paused';
    enrolledAt: Date;
}

const WorkflowEnrollmentSchema: Schema = new Schema({
    workflowId: { type: Schema.Types.ObjectId, ref: 'AutomationWorkflow', required: true, index: true },
    subscriberId: { type: Schema.Types.ObjectId, ref: 'Subscriber', required: true, index: true },
    currentStepIndex: { type: Number, default: 0 },
    nextSendAt: { type: Date, required: true, index: true },
    status: {
        type: String,
        enum: ['active', 'completed', 'unsubscribed', 'paused'],
        default: 'active',
        index: true
    }
}, { timestamps: true });

// Ensure unique enrollment per subscriber per workflow
WorkflowEnrollmentSchema.index({ workflowId: 1, subscriberId: 1 }, { unique: true });

const WorkflowEnrollment: Model<IWorkflowEnrollment> = mongoose.models.WorkflowEnrollment || mongoose.model<IWorkflowEnrollment>('WorkflowEnrollment', WorkflowEnrollmentSchema);

export default WorkflowEnrollment;
