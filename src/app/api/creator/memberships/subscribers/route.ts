import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/memberships/subscribers
 * Get list of active membership subscribers
 * Query params: membershipId (optional - filter by specific membership)
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get('membershipId');

    // Build query
    const query: any = {
        creatorId: user._id,
        paymentStatus: 'paid'
    };

    if (membershipId) {
        query['items.productId'] = membershipId;
    }

    const orders = await Order.find(query)
        .populate('items.productId', 'name type billingCycle')
        .sort({ paidAt: -1 });

    // Extract unique subscribers
    const subscribers = orders.map(order => ({
        orderId: order._id,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        product: order.items.find((item: any) =>
            !membershipId || item.productId._id.toString() === membershipId
        ),
        subscribedAt: order.paidAt,
        status: order.paymentStatus
    }));

    return {
        subscribers,
        total: subscribers.length
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
