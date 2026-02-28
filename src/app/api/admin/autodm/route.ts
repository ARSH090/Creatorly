import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';
import { withAdminAuth } from '@/lib/auth/withAuth';

// GET /api/admin/autodm (Platform-wide DM Health)
export const GET = withAdminAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        await connectToDatabase();

        // 1. Logs
        const [logs, total] = await Promise.all([
            DMLog.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('creatorId', 'displayName email storeSlug')
                .lean(),
            DMLog.countDocuments()
        ]);

        // 2. Health Metrics (Last 24h)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const stats = await DMLog.aggregate([
            { $match: { createdAt: { $gte: dayAgo } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return NextResponse.json({
            logs,
            stats: stats.reduce((acc: any, curr: any) => {
                acc[curr._id] = curr.count;
                return acc;
            }, { success: 0, failed: 0, pending: 0 }),
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
