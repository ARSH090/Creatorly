import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlanChangeLog from '@/lib/models/PlanChangeLog';
import { withAdminAuth } from '@/lib/auth/withAuth';

export const GET = withAdminAuth(async (req) => {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const logs = await PlanChangeLog.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
