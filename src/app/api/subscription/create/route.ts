import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/server-auth';
import Subscription from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { SUBSCRIPTION_PLANS } from '@/lib/constants/tier-limits';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_SECRET!
});

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
        const { planType } = body; // 'CREATOR_MONTHLY', 'CREATOR_YEARLY', 'PRO_MONTHLY', 'PRO_YEARLY'

        if (!planType || !SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]) {
            return NextResponse.json(
                { error: 'Invalid plan type' },
                { status: 400 }
            );
        }

        const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];

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

        // Create Razorpay subscription
        const rzpSubscription = await razorpay.subscriptions.create({
            plan_id: process.env[`RAZORPAY_PLAN_${planType}`] || 'plan_id_placeholder',
            customer_notify: 1,
            total_count: plan.period === 'yearly' ? 1 : 12, // 12 months for monthly, 1 for yearly
            quantity: 1
        });

        // Create subscription in DB (status=pending until first payment)
        const subscription = await Subscription.create({
            userId: user._id,
            originalPrice: plan.priceINR,
            discountAmount: 0,
            finalPrice: plan.priceINR,
            billingPeriod: plan.period,
            startDate: new Date(),
            endDate: new Date(Date.now() + (plan.period === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
            status: 'pending',
            razorpaySubscriptionId: rzpSubscription.id,
            razorpayCustomerId: rzpSubscription.customer_id,
            autoRenew: true
        });

        // Update user with subscription reference (tier will be updated on webhook)
        await User.findByIdAndUpdate(user._id, {
            activeSubscription: subscription._id,
            razorpaySubscriptionId: rzpSubscription.id
        });

        return NextResponse.json({
            message: 'Subscription created. Complete payment to activate.',
            subscription: {
                id: subscription._id,
                razorpaySubscriptionId: rzpSubscription.id,
                plan: plan.tier,
                period: plan.period,
                amount: plan.priceINR,
                status: 'pending'
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
