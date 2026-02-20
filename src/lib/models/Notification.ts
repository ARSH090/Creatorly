import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId; // mapped from creator_id
    type: 'team_invite' | 'content_published' | 'content_failed' | 'payment_success' | 'payment_failed' | 'usage_alert' | 'comment' | 'system' | 'order' | 'payout' | 'new_sale' | 'lead_captured' | 'ai_credits_low' | 'subscription_alert' | 'automation_triggered';
    title: string;
    message: string;
    link?: string; // Legacy support
    actionUrl?: string; // New standard
    read: boolean; // is_read
    readAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: [
            'team_invite', 'content_published', 'content_failed', 'payment_success', 'payment_failed',
            'usage_alert', 'comment', 'system', 'order', 'payout',
            'new_sale', 'lead_captured', 'ai_credits_low', 'subscription_alert', 'automation_triggered'
        ],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    actionUrl: String,
    read: { type: Boolean, default: false, index: true },
    readAt: Date,
    metadata: Schema.Types.Mixed,
}, { timestamps: true });

// TTL index to automatically delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);

export { Notification };
export default Notification;
