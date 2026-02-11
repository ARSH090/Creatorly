import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'team_invite' | 'content_published' | 'content_failed' | 'payment_success' | 'payment_failed' | 'usage_alert' | 'comment' | 'system';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: ['team_invite', 'content_published', 'content_failed', 'payment_success', 'payment_failed', 'usage_alert', 'comment', 'system'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false, index: true },
    metadata: Schema.Types.Mixed,
}, { timestamps: true });

// TTL index to automatically delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);

export { Notification };
export default Notification;
