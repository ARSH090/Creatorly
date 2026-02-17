import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/memberships
 * List all memberships
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    const memberships = await Product.find({
        creatorId: user._id,
        type: 'membership'
    }).sort({ createdAt: -1 });

    // Get subscriber counts
    const membershipsWithStats = await Promise.all(
        memberships.map(async (membership) => {
            const subscriberCount = await Order.countDocuments({
                'items.productId': membership._id,
                paymentStatus: 'paid'
            });

            return {
                _id: membership._id,
                name: membership.name,
                description: membership.description,
                price: membership.price,
                billingCycle: membership.billingCycle,
                thumbnail: membership.thumbnail,
                subscriberCount,
                status: membership.status,
                createdAt: membership.createdAt
            };
        })
    );

    return { memberships: membershipsWithStats };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
