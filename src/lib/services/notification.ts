import { Notification } from '@/lib/models/Notification';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Service to manage in-app notifications
 */
export class NotificationService {
    /**
     * Create a notification and optionally emit it via socket
     */
    static async send(params: {
        userId: string;
        type: any;
        title: string;
        message: string;
        link?: string;
        metadata?: any;
    }) {
        await connectToDatabase();

        const notification = await Notification.create({
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link,
            metadata: params.metadata
        });

        console.log(`[Notification] Sent to ${params.userId}: ${params.title}`);

        // In a real implementation with global sockets, 
        // we'd do something like: io.to(`user:${params.userId}`).emit('new_notification', notification);

        return notification;
    }

    static async getUnread(userId: string) {
        await connectToDatabase();
        return Notification.find({ userId, read: false }).sort({ createdAt: -1 });
    }

    static async markAsRead(notificationId: string) {
        await connectToDatabase();
        return Notification.findByIdAndUpdate(notificationId, { read: true });
    }

    static async markAllAsRead(userId: string) {
        await connectToDatabase();
        return Notification.updateMany({ userId, read: false }, { read: true });
    }
}
