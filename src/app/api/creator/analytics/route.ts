import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { Product } from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/firebase/withAuth';

async function handler(req: NextRequest, user: any) {
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

        // 2. Fetch Orders (Revenue)
        const ordersData = await Order.find({
            creatorId,
            status: 'success',
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        });

        const todayRevenue = ordersData.reduce((acc, order) => acc + (order.amount || 0), 0);

        // 3. Fetch Total Products
        const totalProducts = await Product.countDocuments({ creatorId });

        // 4. Fetch Visitors (Analytics Events)
        const todayVisitors = await AnalyticsEvent.countDocuments({
            creatorId,
            eventType: 'page_view',
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        });

        // 5. Fetch Recent Orders
        const recentOrdersData = await Order.find({ creatorId })
            .sort({ createdAt: -1 })
            .limit(3);

        const recentOrders = recentOrdersData.map(order => ({
            id: order.razorpayOrderId || order._id.toString().slice(-8).toUpperCase(),
            customerEmail: order.customerEmail || 'Anonymous',
            amount: order.amount,
            time: formatTimeAgo(order.createdAt)
        }));

        // 6. Calculate Changes & Engagement Score
        const revenueChange = 0; // Comparisons could be added with historical data
        const visitorChange = 0;
        const repeatRate = 0;
        const pendingPayout = todayRevenue * 0.9;

        // Engagement Score = (Revenue Weight * 0.7) + (Visitor Weight * 0.3)
        // Normalized for a daily "Pulse" score
        const engagementScore = Math.min(100, Math.round((todayRevenue / 500) * 70 + (todayVisitors / 10) * 30));


        // 6. Calculate Storage Usage
        const products = await Product.find({ creatorId });
        let totalStorageBytes = 0;
        products.forEach(p => {
            p.files?.forEach(f => {
                totalStorageBytes += (f.size || 0);
            });
        });
        const storageUsageMb = Math.round(totalStorageBytes / (1024 * 1024));

        return NextResponse.json({
            todayRevenue,
            todayVisitors,
            totalProducts,
            pendingPayout,
            revenueChange,
            visitorChange,
            repeatRate,
            recentOrders,
            engagementScore,

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
