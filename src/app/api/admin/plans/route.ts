import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { seedDefaultPlans } from '@/lib/seeds/seedPlans';
import { invalidatePlanCache } from '@/lib/planCache';

// ── GET /api/admin/plans ──────────────────────────
// Returns all plans including inactive ones + sub counts
export const GET = withAdminAuth(async (req) => {
    try {
        await connectToDatabase();

        const plans = await Plan.find({})
            .sort({ displayOrder: 1 })
            .lean();

        // Get subscriber count per plan
        const counts = await User.aggregate([
            {
                $match: {
                    subscriptionStatus: { $in: ['active', 'trialing'] }
                }
            },
            { $group: { _id: '$subscriptionTier', count: { $sum: 1 } } }
        ]);

        const countsMap = Object.fromEntries(
            counts.map(c => [c._id, c.count])
        );

        const result = plans.map((p: any) => ({
            ...p,
            activeSubscribers: countsMap[p.id] || 0
        }));

        return NextResponse.json({ plans: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// ── POST /api/admin/plans/new ─────────────────────
// Create a new custom plan
export const POST = withAdminAuth(async (req) => {
    try {
        await connectToDatabase();
        const body = await req.json();

        if (!body.id || !body.name || body.price === undefined) {
            return NextResponse.json({ error: 'Missing required fields (id, name, price)' }, { status: 400 });
        }

        const id = body.id.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const existing = await Plan.findOne({ id });
        if (existing) {
            return NextResponse.json({ error: 'Plan ID already exists' }, { status: 400 });
        }

        const plan = await Plan.create({
            ...body,
            id
        });

        await invalidatePlanCache();

        return NextResponse.json({ success: true, plan }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
