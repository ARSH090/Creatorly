import { razorpay } from '@/lib/payments/razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscription from '@/lib/models/Subscription';
import Plan from '@/lib/models/Plan';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { planId, creatorId, customerEmail } = await req.json();

        if (!planId || !creatorId || !customerEmail) {
            return NextResponse.json({ error: 'Plan details missing' }, { status: 400 });
        }

        await connectToDatabase();
        const plan = await Plan.findById(planId);

        if (!plan) {
            return NextResponse.json({ error: 'Invalid Plan' }, { status: 400 });
        }

        // Create Subscription in Razorpay
        const rzpSub = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 12, // Default to 12 cycles
            quantity: 1,
            addons: [],
            notes: {
                creatorId,
                customerEmail
            }
        });

        await connectToDatabase();

        // Save to our DB
        await Subscription.create({
            userId: creatorId, // The creator is the user subscribing to the plan
            customerEmail,
            planId,
            razorpaySubscriptionId: rzpSub.id,
            status: 'created',
            // Defaults for required fields
            originalPrice: plan.monthlyPrice, // Assuming monthly for now, or handle yearly logic
            finalPrice: plan.monthlyPrice,
            billingPeriod: 'monthly',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Temp expiry
        });

        return NextResponse.json({
            subscriptionId: rzpSub.id,
            short_url: rzpSub.short_url // Can redirect directly or use custom UI
        });

    } catch (error: any) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
}
