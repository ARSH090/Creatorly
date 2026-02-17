import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/affiliates
 * List all affiliates for the creator
 */
async function handler(req: NextRequest, user: any, context: any): Promise<any> {
    await connectToDatabase();

    const affiliates = await Affiliate.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    // Get aggregated stats
    const stats = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                paymentStatus: 'paid',
                affiliateId: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$affiliateId',
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
                totalCommission: { $sum: '$commissionAmount' }
            }
        }
    ]);

    // Map stats to affiliates
    const result = affiliates.map((aff: any) => {
        const stat = stats.find((s: any) => s._id?.toString() === aff._id?.toString());
        return {
            ...aff,
            totalSales: stat?.totalSales || 0,
            totalRevenue: stat?.totalRevenue || 0,
            totalCommission: stat?.totalCommission || 0
        };
    });

    return result as any;
}

export const GET = withCreatorAuth(withErrorHandler(handler));
