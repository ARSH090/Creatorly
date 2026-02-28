import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ScheduledContent } from '@/lib/models/ScheduledContent';
import { withAdminAuth } from '@/lib/auth/withAuth';

// GET /api/admin/schedulify (Post Queue Health)
export const GET = withAdminAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        await connectToDatabase();

        const [queue, total] = await Promise.all([
            ScheduledContent.find()
                .sort({ scheduledAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('creatorId', 'displayName email storeSlug')
                .lean(),
            ScheduledContent.countDocuments()
        ]);

        const stats = await ScheduledContent.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return NextResponse.json({
            queue,
            stats: stats.reduce((acc: any, curr: any) => {
                acc[curr._id] = curr.count;
                return acc;
            }, { scheduled: 0, posted: 0, failed: 0 }),
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
