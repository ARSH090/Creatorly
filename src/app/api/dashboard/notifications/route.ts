import { NextRequest } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { getCreatorNotifications } from '@/lib/services/dashboardService';

/**
 * GET /api/dashboard/notifications
 * Get notifications for the creator
 */
async function handler(req: NextRequest, user: any) {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await getCreatorNotifications(user._id.toString(), {
        limit,
        skip,
        unreadOnly
    });

    return result;
}

export const GET = withCreatorAuth(withErrorHandler(handler));
