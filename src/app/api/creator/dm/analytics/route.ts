import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const timeframe = searchParams.get('timeframe') || '7d';

        await connectToDatabase();

        // Calculate date range
        const now = new Date();
        const startDate = new Date();
        if (timeframe === '24h') startDate.setHours(startDate.getHours() - 24);
        else if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
        else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);

        // Aggregation
        const stats = await DMLog.aggregate([
            {
                $match: {
                    creatorId: userId,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSent: { $sum: 1 },
                    delivered: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'delivered'] }, 1, 0] } },
                    read: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'read'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    clicks: { $sum: { $ifNull: ['$metadata.clickCount', 0] } }
                }
            }
        ]);

        const summary = stats[0] || { totalSent: 0, delivered: 0, read: 0, failed: 0, clicks: 0 };

        // Provider Breakdown
        const providerStats = await DMLog.aggregate([
            { $match: { creatorId: userId, createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$provider',
                    count: { $sum: 1 },
                    clicks: { $sum: { $ifNull: ['$metadata.clickCount', 0] } }
                }
            }
        ]);

        return NextResponse.json({
            summary,
            providers: providerStats,
            timeframe
        });

    } catch (error: any) {
        console.error('[Analytics API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
