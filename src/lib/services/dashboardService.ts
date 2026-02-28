/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */
import { DashboardWidget, IDashboardWidget, getDefaultWidgets } from '@/lib/models/DashboardWidget';
import { DashboardMetricCache } from '@/lib/models/DashboardMetricCache';
import { DashboardActivityLog } from '@/lib/models/DashboardActivityLog';
import { Notification } from '@/lib/models/Notification';
import { Order } from '@/lib/models/Order';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import Lead from '@/lib/models/Lead';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Get dashboard summary with key metrics
 */
export async function getDashboardSummary(creatorId: string) {
    await connectToDatabase();

    const objectId = new mongoose.Types.ObjectId(creatorId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Revenue in last 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const revenue24h = await Order.aggregate([
        {
            $match: {
                creatorId: objectId,
                status: 'completed',
                createdAt: { $gte: yesterday }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' }
            }
        }
    ]);

    // Revenue in last 30 days
    const revenue30d = await Order.aggregate([
        {
            $match: {
                creatorId: objectId,
                status: 'completed',
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' },
                count: { $sum: 1 }
            }
        }
    ]);

    // Revenue in previous 30 days (for comparison)
    const prevRevenue30d = await Order.aggregate([
        {
            $match: {
                creatorId: objectId,
                status: 'completed',
                createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' }
            }
        }
    ]);

    // Total leads
    const totalLeads = await Lead.countDocuments({ creatorId: objectId });

    // New leads in last 7 days
    const newLeads7d = await Lead.countDocuments({
        creatorId: objectId,
        createdAt: { $gte: sevenDaysAgo }
    });

    // Prev leads in last 7 days (for comparison)
    const prevLeads7d = await Lead.countDocuments({
        creatorId: objectId,
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    });

    // Active subscribers count
    const activeSubscribers = await Order.countDocuments({
        creatorId: objectId,
        status: 'completed',
        isSubscription: true,
        currentPeriodEnd: { $gte: now }
    });

    // Conversion rate (Store visits to Orders)
    const totalVisits = await AnalyticsEvent.countDocuments({
        creatorId: objectId,
        eventType: 'page_view'
    });

    const totalOrders = await Order.countDocuments({
        creatorId: objectId,
        status: 'completed'
    });

    const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

    // Bounce Rate Calculation (Approximate: sessions with only 1 page view)
    const sessionStats = await AnalyticsEvent.aggregate([
        { $match: { creatorId: objectId, eventType: 'page_view' } },
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
        ? (sessionStats[0].bouncedSessions / sessionStats[0].totalSessions) * 100
        : 0;

    // Average order value
    const avgOrderValue = revenue30d[0]?.count > 0
        ? revenue30d[0].total / revenue30d[0].count
        : 0;

    // MRR calculation (Simplified: sum of monthly equivalents of active subscriptions)
    const activeSubscriptions = await Order.aggregate([
        {
            $match: {
                creatorId: objectId,
                status: 'completed',
                isSubscription: true,
                currentPeriodEnd: { $gte: now }
            }
        },
        {
            $group: {
                _id: null,
                mrr: { $sum: '$total' } // Assuming monthly billing for MRR simplicity
            }
        }
    ]);

    const rev30d = revenue30d[0]?.total || 0;
    const prevRev30d = prevRevenue30d[0]?.total || 0;
    const revGrowth = prevRev30d > 0 ? ((rev30d - prevRev30d) / prevRev30d) * 100 : 100;

    const leadsGrowth = prevLeads7d > 0 ? ((newLeads7d - prevLeads7d) / prevLeads7d) * 100 : 100;

    return {
        revenue24h: revenue24h[0]?.total || 0,
        revenue30d: rev30d,
        revenueGrowth: Math.round(revGrowth * 100) / 100,
        totalLeads,
        newLeads7d,
        leadsGrowth: Math.round(leadsGrowth * 100) / 100,
        activeSubscribers,
        mrr: activeSubscriptions[0]?.mrr || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        totalOrders
    };
}

/**
 * Get widget configuration for a creator
 */
export async function getCreatorWidgets(creatorId: string): Promise<IDashboardWidget[]> {
    await connectToDatabase();

    let widgets = await DashboardWidget.find({ creatorId: new mongoose.Types.ObjectId(creatorId) })
        .sort({ positionOrder: 1 })
        .lean();

    // If no widgets exist, create defaults
    if (widgets.length === 0) {
        const defaultWidgets = getDefaultWidgets(new mongoose.Types.ObjectId(creatorId));
        await DashboardWidget.insertMany(defaultWidgets);
        widgets = await DashboardWidget.find({ creatorId: new mongoose.Types.ObjectId(creatorId) })
            .sort({ positionOrder: 1 })
            .lean();
    }

    return widgets as any[];
}

/**
 * Update widget configuration
 */
export async function updateWidget(
    creatorId: string,
    widgetId: string,
    updates: Partial<IDashboardWidget>
): Promise<IDashboardWidget | null> {
    await connectToDatabase();

    const widget = await DashboardWidget.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(widgetId),
            creatorId: new mongoose.Types.ObjectId(creatorId)
        },
        { $set: updates },
        { new: true }
    );

    return widget;
}

/**
 * Reorder widgets
 */
export async function reorderWidgets(creatorId: string, widgetOrders: { widgetId: string; positionOrder: number }[]): Promise<void> {
    await connectToDatabase();

    const bulkOps = widgetOrders.map(({ widgetId, positionOrder }) => ({
        updateOne: {
            filter: {
                _id: new mongoose.Types.ObjectId(widgetId),
                creatorId: new mongoose.Types.ObjectId(creatorId)
            },
            update: { $set: { positionOrder } }
        }
    }));

    if (bulkOps.length > 0) {
        await DashboardWidget.bulkWrite(bulkOps);
    }
}

/**
 * Get notifications for a creator
 */
export async function getCreatorNotifications(
    creatorId: string,
    options: { limit?: number; skip?: number; unreadOnly?: boolean } = {}
): Promise<{ notifications: any[]; total: number; unreadCount: number }> {
    await connectToDatabase();

    const { limit = 20, skip = 0, unreadOnly = false } = options;
    const query: Record<string, any> = { userId: new mongoose.Types.ObjectId(creatorId) };

    if (unreadOnly) {
        query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ userId: new mongoose.Types.ObjectId(creatorId), read: false })
    ]);

    return { notifications, total, unreadCount };
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(creatorId: string, notificationId: string): Promise<void> {
    await connectToDatabase();

    await Notification.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(notificationId),
            userId: new mongoose.Types.ObjectId(creatorId)
        },
        {
            $set: { read: true, readAt: new Date() }
        }
    );
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(creatorId: string): Promise<void> {
    await connectToDatabase();

    await Notification.updateMany(
        {
            userId: new mongoose.Types.ObjectId(creatorId),
            read: false
        },
        {
            $set: { read: true, readAt: new Date() }
        }
    );
}

/**
 * Get activity log for a creator
 */
export async function getCreatorActivityLog(
    creatorId: string,
    options: { limit?: number; skip?: number; activityType?: string } = {}
): Promise<{ activities: any[]; total: number }> {
    await connectToDatabase();

    const { limit = 20, skip = 0, activityType } = options;
    const query: Record<string, any> = { creatorId: new mongoose.Types.ObjectId(creatorId) };

    if (activityType) {
        query.activityType = activityType;
    }

    const [activities, total] = await Promise.all([
        DashboardActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        DashboardActivityLog.countDocuments(query)
    ]);

    return { activities, total };
}

/**
 * Log an activity
 */
export async function logActivity(
    creatorId: string,
    activityType: string,
    activityData: Record<string, any> = {}
): Promise<void> {
    await connectToDatabase();

    await DashboardActivityLog.create({
        creatorId: new mongoose.Types.ObjectId(creatorId),
        activityType,
        activityData
    });
}

/**
 * Get cached metric or calculate fresh
 */
export async function getCachedOrFreshMetric(
    creatorId: string,
    metricType: string,
    calculateFn: () => Promise<number | Record<string, any>>
): Promise<{ value: number | Record<string, any>; fromCache: boolean }> {
    await connectToDatabase();

    const now = new Date();
    const cacheExpiry = new Date(now.getTime() + 5 * 60 * 1000);

    const cached = await DashboardMetricCache.findOne({
        creatorId: new mongoose.Types.ObjectId(creatorId),
        metricType,
        expiresAt: { $gt: now }
    });

    if (cached) {
        return { value: cached.metricValue, fromCache: true };
    }

    const freshValue = await calculateFn();

    await DashboardMetricCache.findOneAndUpdate(
        {
            creatorId: new mongoose.Types.ObjectId(creatorId),
            metricType
        },
        {
            creatorId: new mongoose.Types.ObjectId(creatorId),
            metricType,
            metricValue: freshValue,
            calculatedAt: now,
            expiresAt: cacheExpiry
        },
        { upsert: true }
    );

    return { value: freshValue, fromCache: false };
}

export default {
    getDashboardSummary,
    getCreatorWidgets,
    updateWidget,
    reorderWidgets,
    getCreatorNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getCreatorActivityLog,
    logActivity,
    getCachedOrFreshMetric
};
