import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';
import { WebhookEventLog } from '@/lib/models/WebhookEventLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function handler(req: NextRequest) {
    await connectToDatabase();

    // 1. Delivery Success Rate
    const stats = await DMLog.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
                failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
            }
        }
    ]);

    const summary = stats[0] || { total: 0, success: 0, failed: 0 };
    const successRate = summary.total > 0 ? ((summary.success / summary.total) * 100).toFixed(1) : 100;

    // 2. Webhook Latency
    const webhooks = await WebhookEventLog.find().sort({ createdAt: -1 }).limit(10);
    const avgLatency = webhooks.length > 0
        ? Math.round(webhooks.reduce((acc, curr) => acc + (curr.processingTime || 0), 0) / webhooks.length)
        : 0;

    // 3. Failures in last 24h
    const failedToday = await DMLog.countDocuments({
        status: 'failed',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    return {
        successRate,
        avgLatency,
        failedToday,
        recentLogs: webhooks.map(w => ({
            id: w._id,
            event: w.eventType,
            success: w.status === 'processed',
            timestamp: w.createdAt,
            latency: w.processingTime,
            platform: w.platform
        }))
    };
}

export const GET = withAdminAuth(withErrorHandler(handler));
