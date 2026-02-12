import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/analytics/funnel
 * Returns conversion funnel for a specific product
 * Views → Add to Cart → Purchase
 * Query params:
 * - productId: required
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
        throw new Error('productId is required');
    }

    // Count each funnel stage
    const views = await AnalyticsEvent.countDocuments({
        creatorId: user._id,
        productId,
        eventType: 'product_view'
    });

    const addToCarts = await AnalyticsEvent.countDocuments({
        creatorId: user._id,
        productId,
        eventType: 'add_to_cart'
    });

    const purchases = await Order.countDocuments({
        creatorId: user._id,
        'items.productId': productId,
        paymentStatus: 'paid'
    });

    // Calculate conversion rates
    const viewToCartRate = views > 0 ? (addToCarts / views) * 100 : 0;
    const cartToPurchaseRate = addToCarts > 0 ? (purchases / addToCarts) * 100 : 0;
    const overallConversion = views > 0 ? (purchases / views) * 100 : 0;

    return {
        productId,
        funnel: {
            views,
            addToCarts,
            purchases
        },
        rates: {
            viewToCart: Math.round(viewToCartRate * 100) / 100,
            cartToPurchase: Math.round(cartToPurchaseRate * 100) / 100,
            overall: Math.round(overallConversion * 100) / 100
        }
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
