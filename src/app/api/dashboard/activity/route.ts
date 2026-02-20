import { NextRequest } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { getCreatorActivityLog } from '@/lib/services/dashboardService';

/**
 * GET /api/dashboard/activity
 * Get activity log for the creator
 */
async function handler(req: NextRequest, user: any) {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const activityType = searchParams.get('activityType') || undefined;

    const result = await getCreatorActivityLog(user._id.toString(), {
        limit,
        skip,
        activityType
    });

    return result;
}

export const GET = withCreatorAuth(withErrorHandler(handler));
