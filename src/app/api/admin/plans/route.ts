import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';
import { withAdminAuth } from '@/lib/firebase/withAuth';

export const GET = withAdminAuth(async (req, user) => {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const tier = searchParams.get('tier');
        const isActive = searchParams.get('isActive');

        const query: any = {};
        if (tier) query.tier = tier;
        if (isActive) query.isActive = isActive === 'true';

        const plans = await Plan.find(query).sort({ sortOrder: 1, createdAt: -1 });
        return NextResponse.json({ plans });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const POST = withAdminAuth(async (req, user) => {
    try {
        await connectToDatabase();
        const body = await req.json();

        // Basic required field validation before Mongoose kicks in
        if (!body.name || !body.tier || !body.billingPeriod) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const plan = await Plan.create(body);
        return NextResponse.json({ success: true, plan }, { status: 201 });
    } catch (error: any) {
        console.error('Plan creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
});
