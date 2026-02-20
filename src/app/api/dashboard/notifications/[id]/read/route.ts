import { NextRequest } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { markNotificationRead } from '@/lib/services/dashboardService';

/**
 * PUT /api/dashboard/notifications/[id]/read
 * Mark a notification as read
 */
async function handler(req: NextRequest, user: any, context: any) {
    const notificationId = context.params.id;
    await markNotificationRead(user._id.toString(), notificationId);
    return { success: true };
}

export const PUT = withCreatorAuth(withErrorHandler(handler));
