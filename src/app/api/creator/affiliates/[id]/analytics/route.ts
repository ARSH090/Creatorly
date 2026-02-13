import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/affiliates/:id/analytics
 * Get detailed performance analytics for a specific affiliate
 */
async function handler(req: NextRequest, user: any, context: any): Promise<any> {
    await connectToDatabase();

    const params = await context.params;
    const affiliateId = params.id;

    const affiliate = await Affiliate.findOne({
        _id: affiliateId,
        creatorId: user._id
    }).populate('affiliateId', 'displayName email avatar');

    if (!affiliate) {
        throw new Error('Affiliate not found');
    }

    // Get affiliate's orders
    const orders = await Order.find({
        creatorId: user._id,
        affiliateId: affiliate._id.toString(), // Use the Affiliate document _id
        paymentStatus: 'paid'
    }).sort({ paidAt: -1 }).limit(50);

    // Calculate conversion rate
    const clicks = orders.length * 3; // Estimate: assume 3 clicks per order (rough metric)
    const conversionRate = clicks > 0 ? (orders.length / clicks) * 100 : 0;

    // Revenue breakdown by product
    const revenueByProduct: any = {};
    for (const order of orders) {
        for (const item of order.items) {
            const productId = item.productId.toString();
            if (!revenueByProduct[productId]) {
                revenueByProduct[productId] = {
                    productId,
                    productName: item.name,
                    revenue: 0,
                    orders: 0
                };
            }
            revenueByProduct[productId].revenue += item.price * (item.quantity || 1);
            revenueByProduct[productId].orders += 1;
        }
    }

    return {
        affiliate: {
            id: affiliate._id,
            affiliateUser: affiliate.affiliateId,
            commissionRate: affiliate.commissionRate,
            status: affiliate.status,
            totalSales: (affiliate as any).conversions || 0,
            totalCommission: affiliate.totalCommission,
            paidCommission: affiliate.paidCommission,
            pendingCommission: affiliate.totalCommission - affiliate.paidCommission
        },
        analytics: {
            orders: orders.length,
            estimatedClicks: clicks,
            conversionRate: Math.round(conversionRate * 100) / 100,
            revenueByProduct: Object.values(revenueByProduct)
        },
        recentOrders: orders.slice(0, 10)
    } as any;
}

export const GET = withCreatorAuth(withErrorHandler(handler));
