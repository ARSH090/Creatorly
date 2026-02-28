import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlanChangeLog from '@/lib/models/PlanChangeLog';
import { withAdminAuth } from '@/lib/auth/withAuth';

export const GET = withAdminAuth(async (req, user, context) => {
    try {
        const { planId } = await context.params;
        await connectToDatabase();

        const logs = await PlanChangeLog.find({ planId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
