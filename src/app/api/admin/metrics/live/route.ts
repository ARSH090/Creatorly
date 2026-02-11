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
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Signups in the last hour
        const signupsLastHour = await User.countDocuments({
            createdAt: { $gte: oneHourAgo }
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

        // 4. System Health (Basic check)
        // We assume 0.0% if no errors in last hour, otherwise calculate from AnalyticsEvent
        // For simplicity here, we return a mock health score or 0 failures
        const errorRate = 0.02; // Mock for UI demo
        const apiLatency = 145; // Mock for UI demo

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
