import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutomationStep {
    id: string;
    type: 'email' | 'wait' | 'condition' | 'tag';
    emailId?: string;
    delayHours?: number;
    field?: string;
    value?: string;
    yesSteps?: IAutomationStep[];
    noSteps?: IAutomationStep[];
}

export interface IAutomationWorkflow extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    triggerType: 'purchase' | 'opt_in' | 'tag_added' | 'manual';
    triggerConfig: Record<string, any>;
    steps: IAutomationStep[];
    isActive: boolean;
    subscriberCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const AutomationWorkflowSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    triggerType: {
        type: String,
        enum: ['purchase', 'opt_in', 'tag_added', 'manual'],
        required: true
    },
    triggerConfig: { type: Schema.Types.Mixed, default: {} },
    steps: { type: [Schema.Types.Mixed], default: [] },
    isActive: { type: Boolean, default: false, index: true },
    subscriberCount: { type: Number, default: 0 },
    content: { type: Schema.Types.Mixed }, // String or Tiptap JSON Object
    waitDays: { type: Number }
}, { timestamps: true });

const AutomationWorkflow: Model<IAutomationWorkflow> = mongoose.models.AutomationWorkflow || mongoose.model<IAutomationWorkflow>('AutomationWorkflow', AutomationWorkflowSchema);

export default AutomationWorkflow;
