import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MatchType {
    EXACT = 'exact',
    CONTAINS = 'contains',
    REGEX = 'regex',
    SEMANTIC = 'semantic'
}

export enum AutomationTriggerType {
    COMMENT = 'comment',
    DIRECT_MESSAGE = 'dm',
    STORY_REPLY = 'story_reply',
    NEW_FOLLOW = 'new_follow',
    BROADCAST = 'broadcast'
}

export interface IAutoReplyRule extends Document {
    ruleId: string; // UUID
    creatorId: mongoose.Types.ObjectId;
    triggerType: AutomationTriggerType;
    matchType: MatchType;
    keywords: string[]; // Support multiple keywords
    replyText: string;
    isActive: boolean;
    // New Fields
    followRequired: boolean;
    cooldownHours: number;
    attachmentType: 'none' | 'product' | 'pdf' | 'booking' | 'custom';
    attachmentId?: string; // ID of the product, file, or booking link

    priority: number;
    loopPreventionId: string; // MD5 of reply text or custom ID
    metadata?: Record<string, any>;
}

const AutoReplyRuleSchema: Schema = new Schema({
    ruleId: { type: String, required: true, unique: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggerType: { type: String, enum: Object.values(AutomationTriggerType), required: true },
    matchType: { type: String, enum: Object.values(MatchType), default: MatchType.CONTAINS },
    keywords: [{ type: String, lowercase: true, trim: true }],
    replyText: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    followRequired: { type: Boolean, default: false },
    cooldownHours: { type: Number, default: 24 },
    attachmentType: {
        type: String,
        enum: ['none', 'product', 'pdf', 'booking', 'custom'],
        default: 'none'
    },
    attachmentId: { type: String },
    priority: { type: Number, default: 0, index: true },
    loopPreventionId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

AutoReplyRuleSchema.index({ creatorId: 1, triggerType: 1, priority: -1 });

export const AutoReplyRule: Model<IAutoReplyRule> = mongoose.models.AutoReplyRule || mongoose.model<IAutoReplyRule>('AutoReplyRule', AutoReplyRuleSchema);
