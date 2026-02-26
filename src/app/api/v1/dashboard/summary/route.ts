
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import DashboardMetricCache from '@/lib/models/DashboardMetricCache';
import Order from '@/lib/models/Order';
import Lead from '@/lib/models/Lead';
import { getMongoUser } from '@/lib/auth/get-user';
import { getCached } from '@/lib/cache';
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

        // 1. Fetch Revenue & Leads through Redis Cache
        const [revenueData, leadsData] = await Promise.all([
            getCached(`dashboard:revenue:${user._id}`, 60, async () => {
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
                if (prevMonthTotal > 0) trend = Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100);
                else if (currentMonthTotal > 0) trend = 100;

                return {
                    today: revenueToday[0]?.total || 0,
                    month: currentMonthTotal,
                    lifetime: revenueLifetime[0]?.total || 0,
                    trend: trend
                };
            }),
            getCached(`dashboard:leads:${user._id}`, 60, async () => {
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
                if (prevMonthLeads > 0) trend = Math.round(((monthLeads - prevMonthLeads) / prevMonthLeads) * 100);
                else if (monthLeads > 0) trend = 100;

                return {
                    total: totalLeads,
                    new_today: todayLeads,
                    trend: trend,
                    converted: 0
                };
            })
        ]);

        // 2. Parallelize usage and profile lookups
        const [profile, productCount] = await Promise.all([
            (async () => {
                const CreatorProfileMod = await import('@/lib/models/CreatorProfile');
                const CreatorProfile = CreatorProfileMod.default || CreatorProfileMod;
                return await (CreatorProfile as any).findOne({ creatorId: user._id }).lean();
            })(),
            (async () => {
                const ProductMod = await import('@/lib/models/Product');
                const Product = ProductMod.default || ProductMod;
                return await (Product as any).countDocuments({ creatorId: user._id });
            })()
        ]);

        // Storage & Usage Limits
        const limits = user.planLimits || { maxProducts: 3, maxStorageMb: 100, maxAiGenerations: 10 };

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
            publishedProducts: productCount,
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
