import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectToDatabase();

        // 1. Fetch Active & Visible Plans
        const dbPlans = await Plan.find({ isActive: true, isVisible: true })
            .sort({ sortOrder: 1 })
            .lean();

        // 2. Map to frontend structure
        const plans = dbPlans.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
            description: p.description,
            price: p.monthlyPrice, // Defaulting to monthly for the simple display
            interval: 'month',
            tier: p.tier,
            isPopular: p.tier === 'pro' || p.tier === 'growth',
            features: [
                `${p.maxProducts === 0 ? 'Unlimited' : p.maxProducts} Products`,
                `${p.maxStorageMb / 1024}GB Storage`,
                p.hasAnalytics ? 'Advanced Analytics' : 'Basic Analytics',
                p.hasCustomDomain ? 'Custom Domain' : 'Creatorly Subdomain',
                p.hasPrioritySupport ? 'Priority Support' : 'Standard Support',
            ].filter(Boolean)
        }));

        return NextResponse.json({ plans });

    } catch (error: any) {
        console.error('Plans API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}
