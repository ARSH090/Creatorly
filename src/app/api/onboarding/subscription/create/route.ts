import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Plan } from '@/lib/models/Plan';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/onboarding/subscription/create
 * Creates a Razorpay subscription mandate for a 14-day free trial.
 */
export async function POST(req: NextRequest) {
    try {
        const { planId, cycle, userData } = await req.json();

        if (!planId || !cycle || !userData) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Fetch Plan from DB
        const plan = await Plan.findOne({ tier: planId, isActive: true });
        if (!plan) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        // 2. Get Razorpay Plan ID
        const razorpalyPlanId = cycle === 'monthly' ? plan.razorpayMonthlyPlanId : plan.razorpayYearlyPlanId;
        if (!razorpalyPlanId) {
            return NextResponse.json({ error: 'Selected plan is not configured for payments' }, { status: 500 });
        }

        // 3. Create Subscription with start_at (14 days trial)
        // start_at must be at least 15 mins in future, and usually we set it to trial end
        const trialEndDate = Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60);

        const subscription = await razorpay.subscriptions.create({
            plan_id: razorpalyPlanId,
            customer_notify: 1,
            quantity: 1,
            total_count: cycle === 'monthly' ? 120 : 10,
            start_at: trialEndDate,
            notes: {
                tempUsername: userData.username,
                email: userData.email,
                plan: planId,
                cycle: cycle,
                isTrial: "true"
            }
        });

        return NextResponse.json({
            success: true,
            subscriptionId: subscription.id,
            apiKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error('Subscription Creation Error:', error);
        return NextResponse.json({ error: error.message || 'Payment initialization failed' }, { status: 500 });
    }
}
