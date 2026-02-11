import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/firebase/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';

/**
 * GET: Fetch automation analytics for the current creator
 * Returns totals for successful, failed, and rate-limited attempts
 */
export const GET = withAuth(async (req, user) => {
    try {
        await connectToDatabase();

        const stats = await DMLog.aggregate([
            { $match: { creatorId: user._id } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            success: 0,
            failed: 0,
            rate_limited: 0,
            total: 0
        };

        stats.forEach(s => {
            if (s._id === 'success') formattedStats.success = s.count;
            if (s._id === 'failed') formattedStats.failed = s.count;
            if (s._id === 'rate_limited') formattedStats.rate_limited = s.count;
            formattedStats.total += s.count;
        });

        // Fetch recent failures for debugging
        const recentFailures = await DMLog.find({ creatorId: user._id, status: 'failed' })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('recipientId triggerType errorDetails createdAt');

        return NextResponse.json({
            stats: formattedStats,
            recentFailures
        });
    } catch (error) {
        console.error('Automation Analytics Error:', error);
        return NextResponse.json({ error: 'Failed to fetch automation analytics' }, { status: 500 });
    }
});
