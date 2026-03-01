import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/server-auth';
import Subscription from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { razorpay } from '@/lib/payments/razorpay';

/**
 * POST /api/subscription/create
 * Create a new subscription (CREATOR or PRO)
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { planId } = body;

        const { getPlanById } = await import('@/lib/planCache');
        const plan = await getPlanById(planId);

        if (!plan || !plan.isActive) {
            return NextResponse.json(
                { error: 'Invalid or inactive plan' },
                { status: 400 }
            );
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({
            userId: user._id,
            status: { $in: ['active', 'pending'] }
        });

        if (existingSubscription) {
            return NextResponse.json(
                { error: 'You already have an active subscription. Cancel it first to change plans.' },
                { status: 400 }
            );
        }

        if (!plan.razorpayPlanId && plan.price > 0) {
            return NextResponse.json(
                { error: 'This plan is not yet linked to a payment gateway. Please contact support.' },
                { status: 400 }
            );
        }

        // Create Razorpay subscription (if not free)
        let rzpSubscriptionId = null;
        let rzpCustomerId = null;

        if (plan.price > 0) {
            const rzpSubscription = await razorpay.subscriptions.create({
                plan_id: plan.razorpayPlanId!,
                customer_notify: 1,
                total_count: 12, // Defaulting to 12 months for now as per previous logic for monthly
                quantity: 1
            });
            rzpSubscriptionId = rzpSubscription.id;
            rzpCustomerId = rzpSubscription.customer_id;
        }

        // Create subscription in DB
        const subscription = await Subscription.create({
            userId: user._id,
            originalPrice: plan.price,
            discountAmount: 0,
            finalPrice: plan.price,
            billingPeriod: 'monthly', // Defaulting to monthly derived from plan price context
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: plan.price > 0 ? 'pending' : 'active', // Free is active instantly
            razorpaySubscriptionId: rzpSubscriptionId,
            razorpayCustomerId: rzpCustomerId,
            autoRenew: true
        });

        // Update user with subscription reference
        await User.findByIdAndUpdate(user._id, {
            activeSubscription: subscription._id,
            razorpaySubscriptionId: rzpSubscriptionId,
            subscriptionTier: plan.id, // Update tier immediately if free
            subscriptionStatus: plan.price > 0 ? 'pending' : 'active'
        });

        return NextResponse.json({
            message: plan.price > 0 ? 'Subscription created. Complete payment to activate.' : 'Plan activated successfully.',
            subscription: {
                id: subscription._id,
                razorpaySubscriptionId: rzpSubscriptionId,
                plan: plan.name,
                amount: plan.price,
                status: subscription.status
            },
            razorpayKey: process.env.RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error('Subscription creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create subscription', details: error.message },
            { status: 500 }
        );
    }
}
