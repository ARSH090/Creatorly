import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';

export const GET = withAuth(async (req: NextRequest, user: any) => {
    try {
        const userId = user._id;
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const platform = searchParams.get('platform');
        const status = searchParams.get('status');

        await connectToDatabase();

        const query: any = { creatorId: userId };
        if (platform) query.provider = platform;
        if (status) query.status = status;

        const [logs, total] = await Promise.all([
            DMLog.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('ruleId', 'name triggerType')
                .lean(),
            DMLog.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            logs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
