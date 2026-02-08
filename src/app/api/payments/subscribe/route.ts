import { razorpay } from '@/lib/payments/razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscription from '@/lib/models/Subscription';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
    try {
        const { planId, creatorId, customerEmail } = await req.json();

        if (!planId || !creatorId || !customerEmail) {
            return NextResponse.json({ error: 'Plan details missing' }, { status: 400 });
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
            creatorId,
            customerEmail,
            planId,
            razorpaySubscriptionId: rzpSub.id,
            status: 'created'
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
