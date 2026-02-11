import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MatchType {
    EXACT = 'exact',
    CONTAINS = 'contains',
    REGEX = 'regex',
    SEMANTIC = 'semantic'
}

export enum AutomationTriggerType {
    COMMENT = 'comment',
    DIRECT_MESSAGE = 'dm'
}

export interface IAutoReplyRule extends Document {
    creatorId: mongoose.Types.ObjectId;
    triggerType: AutomationTriggerType;
    matchType: MatchType;
    keyword: string;
    replyText: string;
    isActive: boolean;
    priority: number;
    metadata?: {
        commentContains?: string[];
        ignoreKeywords?: string[];
    };
}

const AutoReplyRuleSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggerType: { type: String, enum: Object.values(AutomationTriggerType), required: true },
    matchType: { type: String, enum: Object.values(MatchType), default: MatchType.CONTAINS },
    keyword: { type: String, required: true, lowercase: true, trim: true },
    replyText: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

AutoReplyRuleSchema.index({ creatorId: 1, keyword: 1, triggerType: 1 });

export const AutoReplyRule: Model<IAutoReplyRule> = mongoose.models.AutoReplyRule || mongoose.model<IAutoReplyRule>('AutoReplyRule', AutoReplyRuleSchema);
