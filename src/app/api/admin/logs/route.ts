import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AuditLog from '@/lib/models/AuditLog';
import { withAdminAuth } from '@/lib/auth/withAuth';

// GET /api/admin/logs
export const GET = withAdminAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const entityType = searchParams.get('entityType');
        const action = searchParams.get('action');

        await connectToDatabase();

        const query: any = {};
        if (entityType) query.entityType = entityType;
        if (action) query.action = action;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('adminId', 'displayName email avatar')
            .lean();

        const total = await AuditLog.countDocuments(query);

        return NextResponse.json({
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
