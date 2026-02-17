import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import { withAdminAuth } from '@/lib/auth/withAuth';

export const GET = withAdminAuth(async (req, user, context) => {
    try {
        await connectToDatabase();

        // 1. Calculate MRR
        const activeSubscriptions = await Subscription.find({ status: 'active' });
        let totalMRR = 0;
        activeSubscriptions.forEach(sub => {
            if (sub.billingPeriod === 'monthly') {
                totalMRR += sub.finalPrice;
            } else if (sub.billingPeriod === 'yearly') {
                totalMRR += (sub.finalPrice / 12);
            }
        });

        // 2. Churn Rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const canceledLastMonth = await Subscription.countDocuments({
            status: 'canceled',
            updatedAt: { $gte: thirtyDaysAgo }
        });

        const totalActiveStartOfMonth = await Subscription.countDocuments({
            status: 'active',
            createdAt: { $lte: thirtyDaysAgo }
        }) + canceledLastMonth;

        const churnRate = totalActiveStartOfMonth > 0 ? (canceledLastMonth / totalActiveStartOfMonth) * 100 : 0;

        // 3. Subscribers by Tier
        const tierStats = await Subscription.aggregate([
            { $match: { status: 'active' } },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'planId',
                    foreignField: '_id',
                    as: 'plan'
                }
            },
            { $unwind: '$plan' },
            {
                $group: {
                    _id: '$plan.tier',
                    count: { $sum: 1 },
                    revenue: { $sum: '$finalPrice' }
                }
            }
        ]);

        return NextResponse.json({
            mrr: totalMRR,
            churnRate: churnRate.toFixed(2),
            tierStats,
            activeCount: activeSubscriptions.length
        });
    } catch (error: any) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
});
