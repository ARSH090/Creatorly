import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/revenue
 * Get revenue breakdown and statistics
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all'; // all, today, week, month, year

    let startDate: Date | null = null;
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
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
    }

    const match: any = { creatorId: user._id, paymentStatus: 'paid' };
    if (startDate) {
        match.paidAt = { $gte: startDate };
    }

    const result = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                totalCommissions: { $sum: { $ifNull: ['$commissionAmount', 0] } },
                avgOrderValue: { $avg: '$total' }
            }
        }
    ]);

    const stats = result[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        totalCommissions: 0,
        avgOrderValue: 0
    };

    // Calculate net revenue (after commissions)
    const netRevenue = stats.totalRevenue - stats.totalCommissions;

    return {
        period,
        revenue: {
            gross: Math.round(stats.totalRevenue * 100) / 100,
            net: Math.round(netRevenue * 100) / 100,
            commissions: Math.round(stats.totalCommissions * 100) / 100
        },
        orders: stats.totalOrders,
        avgOrderValue: Math.round(stats.avgOrderValue * 100) / 100
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
