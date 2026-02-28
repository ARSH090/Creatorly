import { Order } from '@/lib/models/Order';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Real-time Notification Service
 * Handles broadcasting events to creators and buyers via Socket.io
 */
export class RealtimeService {
    /**
     * Notify creator of a new sale in real-time
     */
    static async notifyNewSale(orderId: string) {
        try {
            await connectToDatabase();
            const order = await Order.findById(orderId).select('creatorId total items customerEmail orderNumber');

            if (!order) return;

            const payload = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                amount: order.total / 100,
                productName: order.items.map(i => i.name).join(', '),
                buyerEmail: order.customerEmail,
                timestamp: new Date()
            };

            // Trigger the internal socket event
            // In a real Next.js setup, we'd hit an internal API or use a Redis Pub/Sub
            // since the socket server usually runs in a separate process or a singleton.

            const socketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/socket/event`;

            await fetch(socketUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': process.env.INTERNAL_SECRET || 'dev-secret'
                },
                body: JSON.stringify({
                    type: 'NEW_SALE',
                    creatorId: order.creatorId.toString(),
                    data: payload
                })
            });

            console.log(`[Realtime] Sale notification sent for ${order.orderNumber}`);
        } catch (error) {
            console.error('[Realtime] Failed to notify sale:', error);
        }
    }
}
