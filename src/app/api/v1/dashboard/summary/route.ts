
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
            // Today
            const todayStart = startOfDay(new Date());
            const monthStart = subDays(new Date(), 30);

            const [revenueToday, revenueMonth, revenueLifetime] = await Promise.all([
                Order.aggregate([
                    { $match: { creatorId: user._id, status: 'completed', createdAt: { $gte: todayStart } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                Order.aggregate([
                    { $match: { creatorId: user._id, status: 'completed', createdAt: { $gte: monthStart } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                Order.aggregate([
                    { $match: { creatorId: user._id, status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ])
            ]);

            revenueData = {
                today: revenueToday[0]?.total || 0,
                month: revenueMonth[0]?.total || 0,
                lifetime: revenueLifetime[0]?.total || 0
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
            const totalLeads = await Lead.countDocuments({ creatorId: user._id });
            const todayLeads = await Lead.countDocuments({ creatorId: user._id, createdAt: { $gte: startOfDay(new Date()) } });

            leadsData = {
                total: totalLeads,
                new_today: todayLeads,
                converted: 0 // Logic for conversion needed (e.g. leads that have matching email in Orders)
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

        // AI Credits - usually real-time from User model or separate ledger
        // Assuming stored on User or Subscription model
        const aiCredits = {
            remaining: user.aiCredits || 0, // Assuming field exists
            consumed: 0 // Need usage log for this
        };

        return NextResponse.json({
            revenue: revenueData,
            leads: leadsData,
            ai_credits: aiCredits,
            performance: { trend: 'stable' } // Placeholder
        });

    } catch (error: any) {
        console.error('Error fetching dashboard summary:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
