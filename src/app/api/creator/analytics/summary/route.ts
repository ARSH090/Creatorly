import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/analytics/summary
 * Returns top-level dashboard metrics:
 * - Total revenue (all-time)
 * - Total sales (order count)
 * - Total leads (email captures via lead magnets)
 * - Conversion rate (orders / unique clicks * 100)
 * - Store views
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const creatorId = user._id;

    // Get date range from query params (default: all-time)
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all'; // all, today, week, month

    let startDate: Date | null = null;
    if (period !== 'all') {
        const now = new Date();
        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
        }
    }

    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    // 1. Parallelize independent metrics queries
    const [revenueResult, totalLeads, storeViews, uniqueClicks] = await Promise.all([
        Order.aggregate([
            {
                $match: {
                    creatorId,
                    paymentStatus: 'paid',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalSales: { $sum: 1 }
                }
            }
        ]),
        Order.countDocuments({
            creatorId,
            amount: 0, // Free lead magnets
            ...dateFilter
        }),
        AnalyticsEvent.countDocuments({
            creatorId,
            eventType: 'store_view',
            ...dateFilter
        }),
        AnalyticsEvent.distinct('ip', {
            creatorId,
            eventType: { $in: ['product_view', 'add_to_cart'] },
            ...dateFilter
        })
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalSales = revenueResult[0]?.totalSales || 0;

    const conversionRate = uniqueClicks.length > 0
        ? (totalSales / uniqueClicks.length) * 100
        : 0;

    return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSales,
        totalLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        storeViews,
        period
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
