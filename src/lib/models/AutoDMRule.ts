import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutoDMRule extends Document {
    creatorId: mongoose.Types.ObjectId;

    // Basic settings
    name: string;
    keyword: string;
    matchType: 'exact' | 'contains' | 'startsWith';
    caseSensitive: boolean;
    postId?: string;
    postUrl?: string;

    // What to send
    dmMessage: string;
    link?: string;
    productId?: string;

    // Comment replies
    commentReplies: Array<{ text: string }>;
    lastUsedReplyIndex: number;

    // Follow gate
    followGate: {
        enabled: boolean;
        replyToNonFollower: string;
        dmAfterFollow: string;
        checkDurationHours: number;
    };

    // Limits
    dmOncePerUser: boolean;
    dailyLimit: number;
    dmsSentToday: number;
    lastResetAt: Date;

    // Stats
    totalTriggers: number;
    totalDMsSent: number;
    totalFollowGateBlocked: number;
    totalFollowGateConverted: number;
    lastTriggeredAt: Date;

    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AutoDMRuleSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, required: true },
    keyword: { type: String, required: true },
    matchType: { type: String, enum: ['exact', 'contains', 'startsWith'], default: 'contains' },
    caseSensitive: { type: Boolean, default: false },
    postId: { type: String, default: null },
    postUrl: { type: String },

    dmMessage: { type: String, required: true },
    link: { type: String },
    productId: { type: String },

    commentReplies: [{
        text: { type: String, required: true },
        _id: false
    }],
    lastUsedReplyIndex: { type: Number, default: -1 },

    followGate: {
        enabled: { type: Boolean, default: false },
        replyToNonFollower: { type: String, default: 'Follow us first @{{name}} then comment again 🙏' },
        dmAfterFollow: { type: String, default: 'Thanks for following! Here\'s your gift 🎁 {{link}}' },
        checkDurationHours: { type: Number, default: 24 }
    },

    dmOncePerUser: { type: Boolean, default: true },
    dailyLimit: { type: Number, default: 500 },
    dmsSentToday: { type: Number, default: 0 },
    lastResetAt: { type: Date, default: Date.now },

    totalTriggers: { type: Number, default: 0 },
    totalDMsSent: { type: Number, default: 0 },
    totalFollowGateBlocked: { type: Number, default: 0 },
    totalFollowGateConverted: { type: Number, default: 0 },
    lastTriggeredAt: { type: Date },

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

AutoDMRuleSchema.index({ creatorId: 1, isActive: 1 });
AutoDMRuleSchema.index({ creatorId: 1, keyword: 1 });

export const AutoDMRule: Model<IAutoDMRule> = mongoose.models.AutoDMRule || mongoose.model<IAutoDMRule>('AutoDMRule', AutoDMRuleSchema);
export default AutoDMRule;
