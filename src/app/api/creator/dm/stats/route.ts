import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { DMLog } from '@/lib/models/DMLog';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/dm/stats
 * Get DM statistics for creator dashboard
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get lead stats with DM
    const [
        totalLeads,
        leadsWithDM,
        dmSent,
        dmFailed,
        dmPending,
        recentDMs
    ] = await Promise.all([
        // Total leads
        Lead.countDocuments({
            creatorId: user._id,
            createdAt: { $gte: startDate }
        }),
        // Leads with DM attempted
        Lead.countDocuments({
            creatorId: user._id,
            dmStatus: { $ne: 'none' },
            createdAt: { $gte: startDate }
        }),
        // DM Sent
        Lead.countDocuments({
            creatorId: user._id,
            dmStatus: 'sent',
            createdAt: { $gte: startDate }
        }),
        // DM Failed
        Lead.countDocuments({
            creatorId: user._id,
            dmStatus: 'failed',
            createdAt: { $gte: startDate }
        }),
        // DM Pending
        Lead.countDocuments({
            creatorId: user._id,
            dmStatus: 'pending',
            createdAt: { $gte: startDate }
        }),
        // Recent DM logs
        DMLog.find({ creatorId: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
    ]);

    // Calculate success rate
    const totalAttempted = dmSent + dmFailed;
    const successRate = totalAttempted > 0 
        ? Math.round((dmSent / totalAttempted) * 100) 
        : 0;

    // DM by provider
    const dmByProvider = await Lead.aggregate([
        {
            $match: {
                creatorId: user._id,
                dmStatus: { $ne: 'none' },
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$dmProvider',
                count: { $sum: 1 }
            }
        }
    ]);

    // Daily DM stats for the period
    const dailyStats = await Lead.aggregate([
        {
            $match: {
                creatorId: user._id,
                dmStatus: { $ne: 'none' },
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                sent: {
                    $sum: { $cond: [{ $eq: ['$dmStatus', 'sent'] }, 1, 0] }
                },
                failed: {
                    $sum: { $cond: [{ $eq: ['$dmStatus', 'failed'] }, 1, 0] }
                },
                pending: {
                    $sum: { $cond: [{ $eq: ['$dmStatus', 'pending'] }, 1, 0] }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return {
        summary: {
            totalLeads,
            leadsWithDM,
            dmSent,
            dmFailed,
            dmPending,
            successRate,
            period: parseInt(period)
        },
        byProvider: dmByProvider.reduce((acc, item) => {
            acc[item._id || 'unknown'] = item.count;
            return acc;
        }, {}),
        dailyStats,
        recentDMs
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
