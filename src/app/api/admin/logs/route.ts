import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AdminLog from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/firebase/withAdminAuth';

/**
 * GET /api/admin/logs
 * Get audit logs with pagination and filters
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const adminEmail = searchParams.get('adminEmail');

    // Build query
    const query: any = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (adminEmail) query.adminEmail = adminEmail;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        AdminLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AdminLog.countDocuments(query)
    ]);

    return NextResponse.json({
        success: true,
        data: {
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}

export const GET = withAdminAuth(handler);
