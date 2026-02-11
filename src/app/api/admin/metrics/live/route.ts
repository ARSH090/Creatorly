import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { Order } from '@/lib/models/Order';
import { adminAuthMiddleware, checkAdminPermission } from '@/lib/middleware/adminAuth';

/**
 * Live Metrics API for Launch Monitoring
 * Aggregates real-time stats for signups, revenue, and active sessions.
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await adminAuthMiddleware(req);
        if (auth instanceof NextResponse) return auth;

        if (!checkAdminPermission('view_analytics', auth.user.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        await connectToDatabase();

        const now = new Date();
        const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Signups in the last hour
        const signupsLastHour = await User.countDocuments({
            createdAt: { $gte: sixtyMinutesAgo }
        });


        // 2. Revenue in the last 24h
        const ordersLast24h = await Order.find({
            status: 'success',
            createdAt: { $gte: twentyFourHoursAgo }
        });
        const revenueLast24h = ordersLast24h.reduce((acc, order) => acc + (order.amount || 0), 0);

        // 3. Active Users (Simulated via recent activity/updatedAt)
        // In a real high-scale app, this would come from Redis/Websockets
        const activeUsersCount = await User.countDocuments({
            updatedAt: { $gte: new Date(now.getTime() - 15 * 60 * 1000) }
        });

        // 4. System Health (Real Monitoring)
        const { AnalyticsEvent } = await import('@/lib/models/AnalyticsEvent');

        const [totalEvents, errorEvents, latencyEvents] = await Promise.all([
            AnalyticsEvent.countDocuments({ createdAt: { $gte: sixtyMinutesAgo } }),
            AnalyticsEvent.countDocuments({
                eventType: 'error',
                createdAt: { $gte: sixtyMinutesAgo }
            }),
            AnalyticsEvent.find({
                eventType: 'performance',
                createdAt: { $gte: sixtyMinutesAgo }
            }).limit(100)
        ]);

        const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) : 0;

        // Calculate average latency from performance events in metadata
        const avgLatency = latencyEvents.length > 0
            ? latencyEvents.reduce((acc, e) => acc + (e.metadata?.latency || 0), 0) / latencyEvents.length
            : 120; // Default baseline if no data

        const apiLatency = Math.round(avgLatency);


        return NextResponse.json({
            signups: signupsLastHour,
            revenue: revenueLast24h,
            activeUsers: activeUsersCount,
            errorRate,
            apiLatency,
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error('[Live Metrics] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
