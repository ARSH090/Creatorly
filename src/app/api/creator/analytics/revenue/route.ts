import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/analytics/revenue
 * Returns time-series revenue data for charts
 * Query params:
 * - period: daily (default), weekly, monthly
 * - days: number of days back (default: 30)
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'daily';
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dateFormat: string;
    switch (period) {
        case 'weekly':
            dateFormat = '%Y-W%V'; // Year-Week
            break;
        case 'monthly':
            dateFormat = '%Y-%m'; // Year-Month
            break;
        default:
            dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const revenueData = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                status: 'completed',
                paymentStatus: 'paid',
                paidAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: '$paidAt' } },
                revenue: { $sum: '$total' },
                orders: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                revenue: 1,
                orders: 1
            }
        }
    ]);

    return {
        period,
        days,
        data: revenueData
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
