import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { AdminLog } from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(req: NextRequest) {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const query: any = {};
    if (search) {
        query.$or = [
            { adminEmail: { $regex: search, $options: 'i' } },
            { action: { $regex: search, $options: 'i' } },
            { targetType: { $regex: search, $options: 'i' } }
        ];
    }

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
        logs,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));

