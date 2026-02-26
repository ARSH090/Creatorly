import { razorpay } from '@/lib/payments/razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscription from '@/lib/models/Subscription';
import Plan from '@/lib/models/Plan';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/lib/models/User';

/**
 * POST /api/payments/subscribe
 * Creates a Razorpay subscription for a creator
 * 
 * FIXES:
 * - BUG-13: Added Clerk authentication — anonymous users cannot create subscriptions
 * - BUG-08: Now uses razorpayMonthlyPlanId or razorpayYearlyPlanId (not MongoDB ObjectId)
 */
export async function POST(req: NextRequest) {
    try {
        // BUG-13 FIX: Require authentication
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId, cycle = 'monthly', customerEmail } = await req.json();

        if (!planId) {
            return NextResponse.json({ error: 'Plan details missing' }, { status: 400 });
        }

        await connectToDatabase();

        // Verify the requesting user exists in DB
        const dbUser = await User.findOne({ clerkId: clerkUserId }).select('_id email username');
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found. Complete onboarding first.' }, { status: 404 });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return NextResponse.json({ error: 'Invalid Plan' }, { status: 400 });
        }

        // BUG-08 FIX: Use the correct Razorpay plan ID based on billing cycle, NOT the MongoDB _id
        const razorpayPlanId = cycle === 'yearly'
            ? plan.razorpayYearlyPlanId
            : plan.razorpayMonthlyPlanId;

        if (!razorpayPlanId) {
            return NextResponse.json({
                error: `No Razorpay plan configured for ${cycle} billing. Contact support.`
            }, { status: 400 });
        }

        // Create Subscription in Razorpay
        const rzpSub = await razorpay.subscriptions.create({
            plan_id: razorpayPlanId,
            customer_notify: 1,
            total_count: cycle === 'yearly' ? 120 : 12, // 10 years / 1 year in cycles
            quantity: 1,
            addons: [],
            notes: {
                creatorId: dbUser._id.toString(),
                customerEmail: customerEmail || dbUser.email,
                billingCycle: cycle
            }
        });

        // Save pending subscription to DB
        await Subscription.create({
            userId: dbUser._id,
            customerEmail: customerEmail || dbUser.email,
            planId,
            razorpaySubscriptionId: rzpSub.id,
            status: 'created',
            billingPeriod: cycle,
            originalPrice: cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
            finalPrice: cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
            startDate: new Date(),
            endDate: new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        });

        return NextResponse.json({
            subscriptionId: rzpSub.id,
            short_url: rzpSub.short_url
        });

    } catch (error: any) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
}
