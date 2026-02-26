import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MatchType {
    EXACT = 'exact',
    CONTAINS = 'contains',
    REGEX = 'regex',
    SEMANTIC = 'semantic',
    STARTS_WITH = 'starts_with'
}

export enum AutomationTriggerType {
    COMMENT = 'comment',
    DIRECT_MESSAGE = 'dm',
    STORY_REPLY = 'story_reply',
    STORY_MENTION = 'story_mention',
    NEW_FOLLOW = 'new_follow',
    POST_LIKE = 'post_like',
    REEL_COMMENT = 'reel_comment',
    BROADCAST = 'broadcast',
    DM_KEYWORD = 'dm_keyword',
    // WhatsApp specific
    WA_KEYWORD = 'wa_keyword',
    WA_FIRST_MESSAGE = 'wa_first_message',
    WA_AWAY = 'wa_away',
    WA_MENU_REPLY = 'wa_menu_reply'
}

export type AutoDMMessageType = 'text' | 'link' | 'product' | 'pdf' | 'booking' | 'carousel' | 'template' | 'interactive' | 'media';

export interface IAutoReplyRule extends Document {
    ruleId: string; // UUID
    name?: string;
    creatorId: mongoose.Types.ObjectId;
    platform: 'instagram' | 'whatsapp';
    triggerType: AutomationTriggerType;
    matchType: MatchType;
    keywords: string[];
    replyText: string;
    isActive: boolean;
    priority: number;

    // Messaging
    messageType: AutoDMMessageType;
    carouselMessages?: Array<{ text: string; delaySeconds: number }>;
    interactiveButtons?: Array<{ id: string; title: string; replyRuleId?: string }>;

    // Logic & Control
    followRequired: boolean;
    followFirstMessage?: string;
    followExpiry: number; // in hours, default 24

    deduplicationWindow: '1h' | '24h' | '7d' | '30d' | 'never' | 'lifetime';
    cooldownHours: number; // legacy compatibility

    attachmentType: 'none' | 'product' | 'pdf' | 'booking' | 'custom';
    attachmentId?: string;

    loopPreventionId: string;

    // Performance
    stats: {
        totalSent: number;
        totalFailed: number;
        followConversions: number;
        lastFiredAt?: Date;
    };

    metadata?: Record<string, any>;
}

const AutoReplyRuleSchema: Schema = new Schema({
    ruleId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'whatsapp'], default: 'instagram', required: true, index: true },
    triggerType: { type: String, enum: Object.values(AutomationTriggerType), required: true },
    matchType: { type: String, enum: Object.values(MatchType), default: MatchType.CONTAINS },
    keywords: [{ type: String, lowercase: true, trim: true }],
    replyText: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0, index: true },

    messageType: {
        type: String,
        enum: ['text', 'link', 'product', 'pdf', 'booking', 'carousel', 'template', 'interactive', 'media'],
        default: 'text'
    },
    carouselMessages: [{
        text: String,
        delaySeconds: { type: Number, default: 0 }
    }],
    interactiveButtons: [{
        id: String,
        title: String,
        replyRuleId: String
    }],

    followRequired: { type: Boolean, default: false },
    followFirstMessage: { type: String },
    followExpiry: { type: Number, default: 24 },

    deduplicationWindow: {
        type: String,
        enum: ['1h', '24h', '7d', '30d', 'never', 'lifetime'],
        default: '24h'
    },
    cooldownHours: { type: Number, default: 24 },

    attachmentType: {
        type: String,
        enum: ['none', 'product', 'pdf', 'booking', 'custom'],
        default: 'none'
    },
    attachmentId: { type: String },
    loopPreventionId: { type: String, required: true, index: true },

    stats: {
        totalSent: { type: Number, default: 0 },
        totalFailed: { type: Number, default: 0 },
        followConversions: { type: Number, default: 0 },
        lastFiredAt: Date
    },

    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

AutoReplyRuleSchema.index({ creatorId: 1, platform: 1, triggerType: 1, priority: -1 });

export const AutoReplyRule: Model<IAutoReplyRule> = mongoose.models.AutoReplyRule || mongoose.model<IAutoReplyRule>('AutoReplyRule', AutoReplyRuleSchema);
