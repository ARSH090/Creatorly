import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { DMLog } from '@/lib/models/DMLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/admin/dm/overview
 * Get DM overview for admin dashboard
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Global DM stats
    const [
        totalDMs,
        dmSent,
        dmFailed,
        dmPending,
        recentFailures
    ] = await Promise.all([
        // Total DMs attempted
        Lead.countDocuments({
            dmStatus: { $ne: 'none' },
            createdAt: { $gte: startDate }
        }),
        // DM Sent
        Lead.countDocuments({
            dmStatus: 'sent',
            createdAt: { $gte: startDate }
        }),
        // DM Failed
        Lead.countDocuments({
            dmStatus: 'failed',
            createdAt: { $gte: startDate }
        }),
        // DM Pending
        Lead.countDocuments({
            dmStatus: 'pending',
            createdAt: { $gte: startDate }
        }),
        // Recent failures with details
        DMLog.find({ status: 'failed' })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('creatorId recipientUsername messageSent errorDetails errorCode createdAt')
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

    // Top creators by DM volume
    const topCreators = await Lead.aggregate([
        {
            $match: {
                dmStatus: { $ne: 'none' },
                creatorId: { $exists: true },
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$creatorId',
                totalDMs: { $sum: 1 },
                sent: { $sum: { $cond: [{ $eq: ['$dmStatus', 'sent'] }, 1, 0] } },
                failed: { $sum: { $cond: [{ $eq: ['$dmStatus', 'failed'] }, 1, 0] } }
            }
        },
        { $sort: { totalDMs: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'creator'
            }
        },
        { $unwind: '$creator' },
        {
            $project: {
                creatorId: '$_id',
                username: '$creator.username',
                email: '$creator.email',
                totalDMs: 1,
                sent: 1,
                failed: 1,
                successRate: {
                    $cond: [
                        { $gt: [{ $add: ['$sent', '$failed'] }, 0] },
                        { $round: [{ $multiply: [{ $divide: ['$sent', { $add: ['$sent', '$failed'] }] }, 100] }, 0] },
                        0
                    ]
                }
            }
        }
    ]);

    // Daily stats
    const dailyStats = await Lead.aggregate([
        {
            $match: {
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

    // Common error messages (using errorDetails)
    const commonErrors = await DMLog.aggregate([
        {
            $match: {
                status: 'failed',
                errorDetails: { $exists: true, $ne: '' },
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$errorDetails',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    return {
        summary: {
            totalDMs,
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
        topCreators,
        dailyStats,
        recentFailures,
        commonErrors
    };
}

export const GET = withAdminAuth(withErrorHandler(handler));
