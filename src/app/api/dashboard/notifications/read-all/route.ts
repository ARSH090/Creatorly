import { NextRequest } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { markAllNotificationsRead } from '@/lib/services/dashboardService';

/**
 * POST /api/dashboard/notifications/read-all
 * Mark all notifications as read
 */
async function handler(req: NextRequest, user: any) {
    await markAllNotificationsRead(user._id.toString());
    return { success: true };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
