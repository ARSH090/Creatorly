import { NextRequest } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { getDashboardSummary } from '@/lib/services/dashboardService';

/**
 * GET /api/dashboard/summary
 * Get dashboard summary with key metrics
 */
async function handler(req: NextRequest, user: any) {
    const summary = await getDashboardSummary(user._id.toString());
    return summary;
}

export const GET = withCreatorAuth(withErrorHandler(handler));
