import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/email/subscribers
 * Get email subscriber list from orders
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Get unique customer emails from all orders
    const subscribers = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                paymentStatus: 'paid',
                customerEmail: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$customerEmail',
                name: { $first: '$customerName' },
                firstPurchase: { $min: '$paidAt' },
                lastPurchase: { $max: '$paidAt' },
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$total' }
            }
        },
        {
            $project: {
                _id: 0,
                email: '$_id',
                name: 1,
                firstPurchase: 1,
                lastPurchase: 1,
                totalOrders: 1,
                totalSpent: { $round: ['$totalSpent', 2] }
            }
        },
        {
            $sort: { lastPurchase: -1 }
        }
    ]);

    return {
        subscribers,
        total: subscribers.length
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
