import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/billing/history
 * Get creator's billing/payment history for platform plans
 * Note: Currently platform plan orders might be stored in the Order model 
 * with a specific product type or flag. For now, we fetch orders where 
 * the creator is also the 'customer' (via email search or flag if available).
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // Fetch orders where this user is the purchaser for platform-related things
    // Or if platform orders are separate, we would query there.
    // For this context, we'll fetch orders associated with this user's email 
    // that are platform plan related, or simply return empty if not found.

    // As a robust starting point, we'll fetch 'completed' orders where 
    // the customerEmail matches the creator's email.
    const history = await Order.find({
        customerEmail: user.email,
        status: 'completed',
        // In a real system, we might filter by a 'platform_plan' category
    })
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        history: history.map(order => ({
            id: order._id,
            date: order.createdAt,
            amount: order.amount,
            currency: order.currency,
            plan: order.items?.[0]?.name || 'Creatorly Plan',
            status: order.status
        }))
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
