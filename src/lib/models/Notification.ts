import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'order' | 'payout' | 'message' | 'system' | 'promotion';
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    readAt?: Date;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['order', 'payout', 'message', 'system', 'promotion'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    data: Schema.Types.Mixed,
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

export default (mongoose.models.Notification as Model<INotification>) ||
    mongoose.model<INotification>('Notification', NotificationSchema);
