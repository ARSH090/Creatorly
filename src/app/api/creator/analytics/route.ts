import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { Product } from '@/lib/models/Product';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { calculatePlatformFee } from '@/lib/utils/tier-utils';

async function handler(req: NextRequest, user: any, context: any) {
    try {
        const { analyticsRateLimit } = await import('@/lib/security/analyticsLimiter');
        const limitResult = await analyticsRateLimit(req);
        if (limitResult) return limitResult;

        const creatorId = user._id;

        await connectToDatabase();

        // 1. Get today's start and end timestamps
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const endOfToday = new Date(now.setHours(23, 59, 59, 999));

        // 2. Fetch Core Stats in parallel
        const [ordersData, totalProducts, todayVisitors] = await Promise.all([
            Order.find({
                creatorId,
                status: 'completed',
                paidAt: { $gte: startOfToday, $lte: endOfToday }
            }),
            Product.countDocuments({ creatorId }),
            AnalyticsEvent.countDocuments({
                creatorId,
                eventType: 'page_view',
                createdAt: { $gte: startOfToday, $lte: endOfToday }
            })
        ]);

        const todayRevenue = ordersData.reduce((acc, order) => acc + (order.total || 0), 0);

        // 3. Fetch Recent Orders
        const recentOrdersData = await Order.find({ creatorId })
            .select('razorpayOrderId amount createdAt customerEmail total')
            .sort({ createdAt: -1 })
            .limit(3);

        const recentOrders = recentOrdersData.map(order => ({
            id: order.razorpayOrderId || order._id.toString().slice(-8).toUpperCase(),
            customerEmail: order.customerEmail || 'Anonymous',
            amount: order.total || order.amount,
            time: formatTimeAgo(order.createdAt)
        }));

        // 4. Calculate Yesterday's Stats for Comparison
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const endOfYesterday = new Date(startOfToday.getTime() - 1);

        const [yesterdayOrders, yesterdayVisitors] = await Promise.all([
            Order.find({
                creatorId,
                status: 'completed',
                paidAt: { $gte: startOfYesterday, $lte: endOfYesterday }
            }),
            AnalyticsEvent.countDocuments({
                creatorId,
                eventType: 'page_view',
                createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
            })
        ]);

        const yesterdayRevenue = yesterdayOrders.reduce((acc, order) => acc + (order.total || 0), 0);

        // 5. Calculate Percentage Changes
        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.min(1000, Math.round(((current - previous) / previous) * 100)); // Cap at 1000%
        };

        const revenueChange = calculateChange(todayRevenue, yesterdayRevenue);
        const visitorChange = calculateChange(todayVisitors, yesterdayVisitors);

        // 6. Metrics and Engagement
        const [uniqueEmails, totalOrdersCount] = await Promise.all([
            Order.distinct('customerEmail', { creatorId }),
            Order.countDocuments({ creatorId })
        ]);
        const repeatRate = totalOrdersCount > 0 ? (uniqueEmails.length / totalOrdersCount) : 0;

        const pendingPayoutResult = calculatePlatformFee(todayRevenue, user.subscriptionTier || 'free');
        const pendingPayout = pendingPayoutResult.creatorPayout;

        const engagementScore = Math.min(100, Math.round(
            (todayRevenue / 1000) * 40 +
            (todayVisitors / 50) * 30 +
            (repeatRate * 30)
        ));

        // 7. Session Stats (Bounce Rate)
        const sessionStats = await AnalyticsEvent.aggregate([
            { $match: { creatorId, eventType: 'page_view', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: '$sessionId', count: { $sum: 1 } } },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    bouncedSessions: { $sum: { $cond: [{ $eq: ['$count', 1] }, 1, 0] } }
                }
            }
        ]);

        const bounceRate = sessionStats[0]?.totalSessions > 0
            ? Math.round((sessionStats[0].bouncedSessions / sessionStats[0].totalSessions) * 100)
            : 0;

        // 8. Storage Usage Aggregation
        const storageAgg = await Product.aggregate([
            { $match: { creatorId } },
            { $unwind: { path: '$files', preserveNullAndEmptyArrays: true } },
            { $group: { _id: null, totalSize: { $sum: '$files.size' } } }
        ]);

        const storageUsageMb = Math.round((storageAgg[0]?.totalSize || 0) / (1024 * 1024));

        return NextResponse.json({
            todayRevenue,
            todayVisitors,
            totalProducts,
            pendingPayout,
            revenueChange,
            visitorChange,
            bounceRate,
            repeatRate,
            recentOrders,
            engagementScore,
            profile: {
                avatar: user.avatar || user.imageUrl,
                displayName: user.displayName || user.fullName
            },

            usage: {
                ai: {
                    used: user.aiUsageCount || 0,
                    limit: user.planLimits?.maxAiGenerations || 10
                },
                storage: {
                    used: storageUsageMb,
                    limit: user.planLimits?.maxStorageMb || 100
                },
                products: {
                    used: totalProducts,
                    limit: user.planLimits?.maxProducts || 3
                }
            }
        });

    } catch (error) {
        console.error('[Dashboard Stats] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function formatTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}

export const GET = withCreatorAuth(handler);
