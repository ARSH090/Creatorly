import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import DailyMetric from '@/lib/models/DailyMetric';
import { Order } from '@/lib/models/Order';
import { getMongoUser } from '@/lib/auth/get-user';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch aggregated series
        const metrics = await DailyMetric.find({
            creatorId: user._id,
            date: { $gte: startDate },
            metricType: { $in: ['revenue', 'orders'] }
        }).sort({ date: 1 }).lean();

        // Product performance breakdown
        const productStats = await Order.aggregate([
            { $match: { creatorId: user._id, status: 'completed', createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    totalRevenue: { $sum: '$items.price' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        return NextResponse.json({
            series: metrics,
            productPerformance: productStats
        });

    } catch (error: any) {
        console.error('Revenue Analytics API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
