import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Plan } from '@/lib/models/Plan';
import { Subscription } from '@/lib/models/Subscription';
import { razorpay } from '@/lib/payments/razorpay';
import { withAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/subscriptions/create
 * Initiates a new subscription with Razorpay
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const body = await req.json();
    const { planId, interval = 'monthly' } = body;

    if (!planId) {
        return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // 1. Fetch Plan Details
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 404 });
    }

    // 2. Check for Existing Active Subscription
    const existingSub = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['active', 'trialing', 'past_due'] }
    });

    if (existingSub) {
        return NextResponse.json({
            error: 'You already have an active subscription',
            subscriptionId: existingSub._id
        }, { status: 400 });
    }

    // 3. Create Subscription in Razorpay
    try {
        // Razorpay Subscription Creation
        const rpPlanId = interval === 'monthly'
            ? (plan.razorpayMonthlyPlanId || plan.razorpayPlanId)
            : (plan.razorpayYearlyPlanId || plan.razorpayPlanId);

        if (!rpPlanId) {
            return NextResponse.json({ error: 'Plan is not configured for payments' }, { status: 500 });
        }

        const rpSubscription = await razorpay.subscriptions.create({
            plan_id: rpPlanId,
            customer_notify: 1,
            total_count: interval === 'monthly' ? 120 : 10, // 10 years
            quantity: 1,
            notes: {
                userId: user._id.toString(),
                email: user.email,
                planName: plan.name
            }
        });

        // 4. Create Pending Subscription record in MongoDB
        const startDate = new Date();
        const endDate = new Date();
        if (interval === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const subscription = await Subscription.create({
            userId: user._id,
            planId: plan._id,
            status: 'pending',
            startDate,
            endDate,
            billingPeriod: interval,
            originalPrice: interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
            discountAmount: 0,
            finalPrice: interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
            razorpaySubscriptionId: rpSubscription.id,
            autoRenew: true,
            cancelAtPeriodEnd: false
        });

        return NextResponse.json({
            subscriptionId: subscription._id,
            razorpaySubscriptionId: rpSubscription.id,
            razorpayKey: process.env.RAZORPAY_KEY_ID,
            amount: subscription.finalPrice * 100, // For display if needed
            name: plan.name
        });

    } catch (rpError: any) {
        console.error('Razorpay Subscription Creation Error:', rpError);
        return NextResponse.json({
            error: 'Failed to initiate payment protocol',
            details: rpError.message
        }, { status: 502 });
    }
}

export const POST = withAuth(withErrorHandler(handler));
