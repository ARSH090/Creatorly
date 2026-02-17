import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/automation/logs
 * Get DM delivery logs
 * Query params: limit, ruleId
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const ruleId = searchParams.get('ruleId');

    const query: any = { creatorId: user._id };
    if (ruleId) query.ruleId = ruleId;

    const logs = await DMLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

    const stats = {
        total: logs.length,
        successful: logs.filter((l: any) => l.success).length,
        failed: logs.filter((l: any) => !l.success).length
    };

    return {
        logs,
        stats
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
