import Notification from '@/lib/models/Notification';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface NotificationPayload {
  userId: string;
  type: 'order' | 'payout' | 'message' | 'system' | 'promotion' | 'team_invite' | 'content_published' | 'content_failed' | 'payment_success' | 'payment_failed' | 'usage_alert' | 'comment';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * In-app notification service
 */
export async function sendInAppNotification(payload: NotificationPayload) {
  try {
    await connectToDatabase();

    const notification = await Notification.create({
      userId: payload.userId,
      type: payload.type as any, // Cast to any to handle overlapping enums or just align perfectly
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata,
      read: false,
    });

    // Emit real-time event if WebSocket connected
    if ((global as any).io) {
      (global as any).io.to(`user_${payload.userId}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Send notification error:', error);
  }
}

/**
 * WhatsApp notification
 */
export async function sendWhatsAppNotification(to: string, message: string) {
  console.log(`📱 [WhatsApp] Sending to ${to}: ${message}`);

  // In production, connect to Interakt/Twilio/Wati API
  // Example for Interakt:
  /*
  await fetch('https://api.interakt.ai/v1/public/message/', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${process.env.INTERAKT_API_KEY}` },
    body: JSON.stringify({ full_phone_number: to, ... })
  });
  */
  return true;
}

/**
 * Utility notifications
 */
export async function notifyOrderCreated(creatorId: string, orderId: string, amount: number, productName: string) {
  return sendInAppNotification({
    userId: creatorId,
    type: 'order',
    title: 'New Order',
    message: `You received a new order for ${productName}`,
    metadata: { orderId, amount, productName },
  });
}

export async function notifyPayout(creatorId: string, amount: number) {
  return sendInAppNotification({
    userId: creatorId,
    type: 'payout',
    title: 'Payout Processed',
    message: `Payout of ₹${(amount / 100).toFixed(2)} has been processed`,
    metadata: { amount },
  });
}
