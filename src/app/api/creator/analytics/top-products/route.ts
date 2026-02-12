import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/analytics/top-products
 * Returns best-selling products ranked by revenue or units sold
 * Query params:
 * - sortBy: revenue (default) | units
 * - limit: number of products to return (default: 10)
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sortBy') || 'revenue';
    const limit = parseInt(searchParams.get('limit') || '10');

    const sortField = sortBy === 'units' ? 'units' : 'revenue';

    const topProducts = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                paymentStatus: 'paid'
            }
        },
        {
            $unwind: '$items'
        },
        {
            $group: {
                _id: '$items.productId',
                title: { $first: '$items.name' },
                revenue: {
                    $sum: {
                        $multiply: ['$items.price', { $ifNull: ['$items.quantity', 1] }]
                    }
                },
                units: {
                    $sum: { $ifNull: ['$items.quantity', 1] }
                },
                orders: { $sum: 1 }
            }
        },
        {
            $sort: { [sortField]: -1 }
        },
        {
            $limit: limit
        },
        {
            $project: {
                _id: 0,
                productId: '$_id',
                title: 1,
                revenue: { $round: ['$revenue', 2] },
                units: 1,
                orders: 1
            }
        }
    ]);

    return {
        sortBy,
        products: topProducts
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
