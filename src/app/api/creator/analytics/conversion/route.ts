import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
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

    // Get daily visitors and purchases
    const visitors = await AnalyticsEvent.aggregate([
        {
            $match: {
                creatorId: user._id,
                eventType: 'page_view',
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                uniqueIPs: { $addToSet: "$ip" }
            }
        },
        {
            $project: {
                date: "$_id",
                visitors: { $size: "$uniqueIPs" }
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
    const allDates = Array.from(new Set([
        ...visitors.map(v => v.date),
        ...purchases.map(p => p.date)
    ])).sort();

    const conversionData = allDates.map(date => {
        const v = visitors.find(v => v.date === date);
        const p = purchases.find(p => p.date === date);

        const visitorCount = v ? v.visitors : 0;
        const purchaseCount = p ? p.purchases : 0;
        const conversionRate = visitorCount > 0 ? (purchaseCount / visitorCount) * 100 : 0;

        return {
            date,
            visitors: visitorCount,
            purchases: purchaseCount,
            sales: purchaseCount,
            conversionRate: Math.round(conversionRate * 100) / 100
        };
    });

    return conversionData;
}

export const GET = withCreatorAuth(withErrorHandler(handler));
