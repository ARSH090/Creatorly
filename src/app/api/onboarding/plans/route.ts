import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Plan } from '@/lib/models/Plan';

/**
 * GET /api/onboarding/plans
 * Fetches active plans for the pricing step
 */
export async function GET() {
    try {
        await connectToDatabase();

        const plans = await Plan.find({
            isActive: true,
            isVisible: true
        })
            .sort({ sortOrder: 1 })
            .lean();

        // Format plans for the UI
        const formattedPlans = plans.map((plan: any) => ({
            id: plan.tier,
            name: plan.name,
            description: plan.description,
            monthly: {
                price: plan.price || 0,
                display: `₹${((plan.price || 0) / 100).toLocaleString('en-IN')}`,
                razorpayId: plan.razorpayPlanId
            },
            yearly: {
                price: (plan.price || 0) * 10,
                display: `₹${(((plan.price || 0) * 10) / 100).toLocaleString('en-IN')}`,
                razorpayId: plan.razorpayPlanId, // Placeholder
                savings: `Save ₹${(((plan.price || 0) * 12 - (plan.price || 0) * 10) / 100).toLocaleString('en-IN')}`
            },
            features: plan.features || [],
            limits: plan.limits,
            trialLimits: plan.trialLimits,
            badge: plan.tier === 'pro' ? 'Most Popular 🔥' : null
        }));

        return NextResponse.json({ success: true, plans: formattedPlans });

    } catch (error: any) {
        console.error('Fetch Plans Error:', error);
        return NextResponse.json({ error: 'Failed to fetch active plans' }, { status: 500 });
    }
}
