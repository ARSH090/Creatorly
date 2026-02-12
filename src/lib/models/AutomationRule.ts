import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutomationRule extends Document {
    creatorId: mongoose.Types.ObjectId;
    platform: 'instagram' | 'facebook' | 'twitter';
    trigger: 'keyword' | 'dm' | 'comment' | 'mention';
    keywords: string[];
    action: 'auto_reply' | 'send_link' | 'tag';
    response: string;
    productId?: mongoose.Types.ObjectId;
    isActive: boolean;
    triggerCount: number;
    lastTriggered?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AutomationRuleSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: {
        type: String,
        enum: ['instagram', 'facebook', 'twitter'],
        required: true
    },
    trigger: {
        type: String,
        enum: ['keyword', 'dm', 'comment', 'mention'],
        required: true
    },
    keywords: [{ type: String }],
    action: {
        type: String,
        enum: ['auto_reply', 'send_link', 'tag'],
        required: true
    },
    response: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    isActive: { type: Boolean, default: true },
    triggerCount: { type: Number, default: 0 },
    lastTriggered: { type: Date }
}, { timestamps: true });

AutomationRuleSchema.index({ creatorId: 1, isActive: 1 });

const AutomationRule: Model<IAutomationRule> = mongoose.models.AutomationRule || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);
export default AutomationRule;
