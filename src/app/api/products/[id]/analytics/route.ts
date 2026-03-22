import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';
import { DailyMetric } from '@/lib/models/DailyMetric';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';

/**
 * GET /api/products/[id]/analytics - Get product analytics
 */
export const GET = withCreatorAuth(async (req, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
        await connectToDatabase();
        
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const timeframe = searchParams.get('timeframe') || '30d';
        
        // ... (rest of the logic)
        // Verify product belongs to this creator
        const product = await Product.findOne({ _id: id, creatorId: user._id });
        if (!product) {
            return NextResponse.json(errorResponse('Product not found'), { status: 404 });
        }
        
        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }
        
        // 3. Get Real Metrics from DailyMetric (Aggregation)
        const dailyMetrics = await DailyMetric.find({
            creatorId: user._id,
            date: { $gte: startDate.toISOString().split('T')[0] }
        }).sort({ date: 1 });

        // Filter metrics for this specific product (if DailyMetric tracks it - or aggregate from Orders)
        const totalViews = await AnalyticsEvent.countDocuments({
            productId: id,
            eventType: 'product_view',
            createdAt: { $gte: startDate }
        });

        const OrderModel = (await import('@/lib/models/Order')).Order;
        const totalOrders = await OrderModel.countDocuments({
            "items.productId": id,
            status: { $in: ['completed', 'success'] },
            createdAt: { $gte: startDate }
        });

        const timeframeRevenue = await OrderModel.aggregate([
            { $match: { "items.productId": new (await import('mongoose')).default.Types.ObjectId(id), status: { $in: ['completed', 'success'] }, createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);

        const analytics = {
            timeframe,
            dateRange: { start: startDate, end: now },
            totalRevenue: timeframeRevenue[0]?.total || 0,
            totalSales: totalOrders,
            avgOrderValue: totalOrders > 0 ? (timeframeRevenue[0]?.total || 0) / totalOrders : 0,
            conversionRate: totalViews > 0 ? (totalOrders / totalViews) * 100 : 0,
            views: totalViews,
            dailyStats: dailyMetrics.map(m => ({
                date: m.date,
                views: m.count,
                sales: 0, 
                revenue: m.revenue
            })),
            trafficSources: await AnalyticsEvent.aggregate([
                { $match: { productId: new (await import('mongoose')).default.Types.ObjectId(id), createdAt: { $gte: startDate } } },
                { $group: { _id: "$utm_source", visitors: { $sum: 1 } } },
                { $project: { source: { $ifNull: ["$_id", "Direct"] }, visitors: 1 } }
            ])
        };

        return NextResponse.json(successResponse(analytics, 'Analytics retrieved successfully'));
    } catch (error: any) {
        console.error('Product Analytics Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch analytics', error.message), { status: 500 });
    }
});
