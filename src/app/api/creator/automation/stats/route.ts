import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';
import { AutomationRule } from '@/lib/models/AutomationRule';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/automation/stats
 * Get automation performance statistics
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get DM stats
    const dmStats = await DMLog.aggregate([
        {
            $match: {
                creatorId: user._id,
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalSent: { $sum: 1 },
                successful: {
                    $sum: { $cond: ['$success', 1, 0] }
                },
                failed: {
                    $sum: { $cond: ['$success', 0, 1] }
                }
            }
        }
    ]);

    // Get active rules count
    const activeRules = await AutomationRule.countDocuments({
        creatorId: user._id,
        isActive: true
    });

    const stats = dmStats[0] || { totalSent: 0, successful: 0, failed: 0 };
    const successRate = stats.totalSent > 0 ? (stats.successful / stats.totalSent) * 100 : 0;

    return {
        period: `${days} days`,
        dmsSent: stats.totalSent,
        successful: stats.successful,
        failed: stats.failed,
        successRate: Math.round(successRate * 100) / 100,
        activeRules
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
