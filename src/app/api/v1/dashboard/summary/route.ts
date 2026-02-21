
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import DashboardMetricCache from '@/lib/models/DashboardMetricCache';
import Order from '@/lib/models/Order';
import Lead from '@/lib/models/Lead'; // Assuming Lead model exists
import { getMongoUser } from '@/lib/auth/get-user';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        // Default to 'today' or 30d? Let's implement basic snapshot
        // The requirements ask for: revenue { today, week, month, lifetime }, leads { total, new_today... }
        // We can try to fetch all these.

        // CACHE STRATEGY:
        // We look for a recent 'dashboard_snapshot' in cache.
        const CACHE_KEY = `dashboard_snapshot_${user._id}`;
        // Actually, DashboardMetricCache model uses 'metricType'. 
        // We can abuse it or stick to specific types. Let's use specific types.

        // 1. Check Cache
        const [cachedRevenue, cachedLeads] = await Promise.all([
            DashboardMetricCache.findOne({ creatorId: user._id, metricType: 'revenue_24h', expiresAt: { $gt: new Date() } }),
            DashboardMetricCache.findOne({ creatorId: user._id, metricType: 'leads_total', expiresAt: { $gt: new Date() } })
        ]);

        let revenueData = cachedRevenue?.metricValue;
        let leadsData = cachedLeads?.metricValue;

        // 2. Calculate if missing
        if (!revenueData) {
            // Calculate Revenue
            const now = new Date();
            const todayStart = startOfDay(now);
            const thirtyDaysAgo = subDays(now, 30);
            const sixtyDaysAgo = subDays(now, 60);

            const [revenueToday, revenueMonth, revenuePrevMonth, revenueLifetime] = await Promise.all([
                Order.aggregate([
                    { $match: { creatorId: user._id, status: 'completed', createdAt: { $gte: todayStart } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                Order.aggregate([
                    { $match: { creatorId: user._id, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                Order.aggregate([
                    { $match: { creatorId: user._id, status: 'completed', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                Order.aggregate([
                    { $match: { creatorId: user._id, status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ])
            ]);

            const currentMonthTotal = revenueMonth[0]?.total || 0;
            const prevMonthTotal = revenuePrevMonth[0]?.total || 0;

            let trend = 0;
            if (prevMonthTotal > 0) {
                trend = Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100);
            } else if (currentMonthTotal > 0) {
                trend = 100;
            }

            revenueData = {
                today: revenueToday[0]?.total || 0,
                month: currentMonthTotal,
                lifetime: revenueLifetime[0]?.total || 0,
                trend: trend
            };

            // Cache it (60 seconds)
            await DashboardMetricCache.findOneAndUpdate(
                { creatorId: user._id, metricType: 'revenue_24h' },
                {
                    metricValue: revenueData,
                    expiresAt: new Date(Date.now() + 60 * 1000)
                },
                { upsert: true }
            );
        }

        if (!leadsData) {
            // Calculate Leads
            const now = new Date();
            const thirtyDaysAgo = subDays(now, 30);
            const sixtyDaysAgo = subDays(now, 60);

            const [totalLeads, todayLeads, monthLeads, prevMonthLeads] = await Promise.all([
                Lead.countDocuments({ creatorId: user._id }),
                Lead.countDocuments({ creatorId: user._id, createdAt: { $gte: startOfDay(now) } }),
                Lead.countDocuments({ creatorId: user._id, createdAt: { $gte: thirtyDaysAgo } }),
                Lead.countDocuments({ creatorId: user._id, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
            ]);

            let trend = 0;
            if (prevMonthLeads > 0) {
                trend = Math.round(((monthLeads - prevMonthLeads) / prevMonthLeads) * 100);
            } else if (monthLeads > 0) {
                trend = 100;
            }

            leadsData = {
                total: totalLeads,
                new_today: todayLeads,
                trend: trend,
                converted: 0 // Placeholder
            };

            await DashboardMetricCache.findOneAndUpdate(
                { creatorId: user._id, metricType: 'leads_total' },
                {
                    metricValue: leadsData,
                    expiresAt: new Date(Date.now() + 60 * 1000)
                },
                { upsert: true }
            );
        }

        // Fetch Creator Profile for Store Status
        const CreatorProfile = (await import('@/lib/models/CreatorProfile')).default;
        const profile = await CreatorProfile.findOne({ creatorId: user._id });

        // Storage & Usage Limits
        const limits = user.planLimits || {
            maxProducts: 3,
            maxStorageMb: 100,
            maxAiGenerations: 10
        };

        const Product = (await import('@/lib/models/Product')).default;
        const productCount = await Product.countDocuments({ creatorId: user._id });

        const usage = {
            ai: {
                used: user.aiUsageCount || 0,
                total: limits.maxAiGenerations,
                percentage: Math.round(((user.aiUsageCount || 0) / limits.maxAiGenerations) * 100)
            },
            storage: {
                used: user.storageUsageMb || 0,
                total: limits.maxStorageMb,
                percentage: Math.round(((user.storageUsageMb || 0) / limits.maxStorageMb) * 100)
            },
            products: {
                used: productCount,
                total: limits.maxProducts,
                percentage: Math.round((productCount / limits.maxProducts) * 100)
            }
        };

        return NextResponse.json({
            revenue: revenueData,
            leads: leadsData,
            ai_credits: {
                remaining: Math.max(0, limits.maxAiGenerations - (user.aiUsageCount || 0)),
                total: limits.maxAiGenerations
            },
            usage,
            store: {
                isLive: profile?.features?.storefrontEnabled && user.status === 'active',
                status: (profile?.features?.storefrontEnabled && user.status === 'active') ? 'Live' : 'Offline',
                username: user.username
            },
            subscription: {
                status: user.subscriptionStatus,
                tier: user.subscriptionTier,
                expiresAt: user.subscriptionEndAt
            },
            performance: { trend: 'stable' }
        });

    } catch (error: any) {
        console.error('Error fetching dashboard summary:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
