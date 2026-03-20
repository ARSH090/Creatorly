import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import DailyMetric from '@/lib/models/DailyMetric';

export async function GET(req: NextRequest) {
    // Verify CRON secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Pre-aggregate raw events into DailyMetric documents for fast dashboard loading
        const stats = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: yesterday, $lt: today } } },
            { $group: {
                _id: { creatorId: '$creatorId', type: '$eventType' },
                count: { $sum: 1 }
            }}
        ]);

        for (const stat of stats) {
            await DailyMetric.findOneAndUpdate(
                { creatorId: stat._id.creatorId, date: yesterday, metricName: stat._id.type },
                { $set: { value: stat.count } },
                { upsert: true }
            );
        }

        return NextResponse.json({ success: true, processed: stats.length });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
