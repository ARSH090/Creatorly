import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { seedDefaultPlans } from '@/lib/seeds/seedPlans';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { invalidatePlanCache } from '@/lib/planCache';

export const POST = withAdminAuth(async (req) => {
    try {
        const result = await seedDefaultPlans();
        await invalidatePlanCache();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
