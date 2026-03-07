import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { withCreatorAuth } from '@/lib/auth/withAuth';

/**
 * GET /api/creator/analytics/chart
 * Returns time-series data for revenue, orders, and views
 * Query params: ?days=7 (default 7, max 90)
 */
async function handler(req: NextRequest, user: any) {
    try {
        const { searchParams } = new URL(req.url);
        const days = Math.min(parseInt(searchParams.get('days') || '7', 10) || 7, 90);

        await connectToDatabase();
        const creatorId = user._id;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Revenue + orders per day
        const revenueByDay = await Order.aggregate([
            {
                $match: {
                    creatorId,
                    status: 'completed',
                    paidAt: { $gte: startDate },
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Views per day
        const viewsByDay = await AnalyticsEvent.aggregate([
            {
                $match: {
                    creatorId,
                    eventType: 'page_view',
                    createdAt: { $gte: startDate },
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    views: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Build complete date array (no gaps)
        const dateMap: Record<string, { date: string; revenue: number; orders: number; views: number }> = {};
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            dateMap[key] = { date: key, revenue: 0, orders: 0, views: 0 };
        }

        revenueByDay.forEach((r: any) => {
            if (dateMap[r._id]) {
                dateMap[r._id].revenue = r.revenue;
                dateMap[r._id].orders = r.orders;
            }
        });

        viewsByDay.forEach((v: any) => {
            if (dateMap[v._id]) dateMap[v._id].views = v.views;
        });

        const chartData = Object.values(dateMap);

        return NextResponse.json({
            chartData,
            summary: {
                totalRevenue: chartData.reduce((s, d) => s + d.revenue, 0),
                totalOrders: chartData.reduce((s, d) => s + d.orders, 0),
                totalViews: chartData.reduce((s, d) => s + d.views, 0),
                days,
            }
        });
    } catch (error: any) {
        console.error('[ANALYTICS_CHART]', error);
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
