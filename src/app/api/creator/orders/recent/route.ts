import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/orders/recent
 * Get recent orders (last 50)
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const orders = await Order.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('orderNumber customerEmail total paymentStatus items createdAt paidAt')
        .lean();

    // Calculate quick stats
    const stats = {
        total: orders.length,
        paid: orders.filter(o => o.paymentStatus === 'paid').length,
        pending: orders.filter(o => o.paymentStatus === 'pending').length,
        totalRevenue: orders
            .filter(o => o.paymentStatus === 'paid')
            .reduce((sum, o) => sum + o.total, 0)
    };

    return {
        orders,
        stats
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
