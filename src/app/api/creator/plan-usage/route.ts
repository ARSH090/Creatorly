import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import Product from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';
import { DMLog } from '@/lib/models/DMLog';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/plan-usage
 * Get current plan usage vs limits
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const creator = await User.findById(user._id);

    if (!creator) {
        return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
        );
    }

    const plan = creator.subscriptionTier || creator.plan || 'free';

    // Get plan limits
    const { getPlanLimits } = await import('@/lib/utils/planLimits');
    const limits = getPlanLimits(plan as any);

    // Calculate current usage
    const productCount = await Product.countDocuments({
        creatorId: user._id,
        status: { $in: ['draft', 'published'] }
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                paymentStatus: 'paid',
                paidAt: { $gte: thisMonth }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' }
            }
        }
    ]);

    const revenue = monthlyRevenue[0]?.total || 0;

    // Calculate DM usage for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const dmCount = await DMLog.countDocuments({
        creatorId: user._id,
        createdAt: { $gte: startOfMonth },
        status: 'success'
    });

    return {
        plan,
        limits: {
            products: limits.products,
            dmsPerMonth: limits.dmsPerMonth,
            maxStorageMb: limits.maxStorageMb,
            transactionFee: limits.transactionFee * 100, // Convert to percentage
            affiliates: limits.affiliates,
            emailMarketing: limits.emailMarketing,
            upsells: limits.upsells,
            discountCodes: limits.discountCodes
        },
        usage: {
            products: productCount,
            dmsThisMonth: dmCount,
            storageMb: creator.storageUsageMb || 0,
            monthlyRevenue: Math.round(revenue * 100) / 100
        },
        warnings: []
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
