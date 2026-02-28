import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Step Types ───────────────────────────────────────────────────────────────

export type FlowStepType = 'message' | 'question' | 'email_collect' | 'button' | 'delay';
export type FlowTriggerType = 'comment' | 'dm_keyword' | 'story_reply' | 'new_follower';
export type FlowButtonAction = 'next_step' | 'send_link' | 'collect_email' | 'end';

export interface IFlowButton {
    id: string;
    label: string;         // "Yes, send me the link!"
    action: FlowButtonAction;
    nextStepId?: string;
    url?: string;
}

export interface IFlowStep {
    id: string;            // UUID for referencing between steps
    type: FlowStepType;
    content: string;       // DM text / question text
    buttons?: IFlowButton[];
    delaySeconds?: number; // for delay steps
    nextStepId?: string;   // auto-advance (no button needed)
    order: number;
}

export interface IFlowTrigger {
    type: FlowTriggerType;
    keywords?: string[];             // for comment / dm_keyword triggers
    matchType: 'exact' | 'contains' | 'any';
    postId?: 'all' | string;         // specific post ID or 'all'
}

export interface IFollowGate {
    enabled: boolean;
    replyVariants: string[];         // public comment replies while waiting for follow
    dmAfterFollow: string;           // DM to send once they follow
}

export interface IFlowStats {
    triggered: number;
    dmsSent: number;
    emailsCollected: number;
    linksClicked: number;
    delivered: number;
    read: number;
}

export interface IAutoDMFlow extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    trigger: IFlowTrigger;
    steps: IFlowStep[];
    followGate: IFollowGate;
    isActive: boolean;
    stats: IFlowStats;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const FlowButtonSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    action: { type: String, enum: ['next_step', 'send_link', 'collect_email', 'end'], required: true },
    nextStepId: String,
    url: String,
}, { _id: false });

const FlowStepSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['message', 'question', 'email_collect', 'button', 'delay'], required: true },
    content: { type: String, default: '' },
    buttons: [FlowButtonSchema],
    delaySeconds: Number,
    nextStepId: String,
    order: { type: Number, default: 0 },
}, { _id: false });

const AutoDMFlowSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    trigger: {
        type: { type: String, enum: ['comment', 'dm_keyword', 'story_reply', 'new_follower'], required: true },
        keywords: [{ type: String, lowercase: true, trim: true }],
        matchType: { type: String, enum: ['exact', 'contains', 'any'], default: 'contains' },
        postId: { type: String, default: 'all' },
    },
    steps: [FlowStepSchema],
    followGate: {
        enabled: { type: Boolean, default: false },
        replyVariants: [{ type: String }],
        dmAfterFollow: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: false },
    stats: {
        triggered: { type: Number, default: 0 },
        dmsSent: { type: Number, default: 0 },
        emailsCollected: { type: Number, default: 0 },
        linksClicked: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
    },
}, { timestamps: true });

AutoDMFlowSchema.index({ creatorId: 1, isActive: 1 });
AutoDMFlowSchema.index({ creatorId: 1, 'trigger.type': 1 });

export const AutoDMFlow: Model<IAutoDMFlow> =
    mongoose.models.AutoDMFlow || mongoose.model<IAutoDMFlow>('AutoDMFlow', AutoDMFlowSchema);

export default AutoDMFlow;
