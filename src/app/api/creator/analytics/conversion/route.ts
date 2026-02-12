import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/analytics/conversion
 * Get conversion rate trends over time
 * Query params: days (default: 30)
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily clicks and purchases
    const clicks = await AnalyticsEvent.aggregate([
        {
            $match: {
                creatorId: user._id,
                eventType: { $in: ['product_view', 'add_to_cart'] },
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$day',
                uniqueIPs: { $addToSet: '$ip' }
            }
        },
        {
            $project: {
                date: '$_id',
                clicks: { $size: '$uniqueIPs' }
            }
        },
        {
            $sort: { date: 1 }
        }
    ]);

    const purchases = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                paymentStatus: 'paid',
                paidAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                date: '$_id',
                purchases: '$count'
            }
        },
        {
            $sort: { date: 1 }
        }
    ]);

    // Merge data
    const conversionData = clicks.map(c => {
        const p = purchases.find(p => p.date === c.date);
        const purchaseCount = p ? p.purchases : 0;
        const conversionRate = c.clicks > 0 ? (purchaseCount / c.clicks) * 100 : 0;

        return {
            date: c.date,
            clicks: c.clicks,
            purchases: purchaseCount,
            conversionRate: Math.round(conversionRate * 100) / 100
        };
    });

    // Calculate average
    const totalClicks = conversionData.reduce((sum, d) => sum + d.clicks, 0);
    const totalPurchases = conversionData.reduce((sum, d) => sum + d.purchases, 0);
    const avgConversion = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;

    return {
        days,
        averageConversion: Math.round(avgConversion * 100) / 100,
        data: conversionData
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
