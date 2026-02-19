import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Subscription } from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Connect to DB to get secret if not in env (or use env as primary)
        await dbConnect();

        let secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            const settings = await PlatformSettings.findOne();
            if (settings?.razorpayWebhookSecret) {
                secret = settings.razorpayWebhookSecret;
            }
        }

        if (!secret) {
            console.error('Razorpay Webhook Secret not configured');
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        const payload = event.payload;

        console.log('Razorpay Webhook Event:', event.event);

        if (event.event === 'subscription.activated') {
            const subData = payload.subscription.entity;
            // subData.id, subData.customer_id, subData.start_at, subData.end_at, subData.status

            // Find the subscription by ID
            let subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });

            if (!subscription) {
                // If detailed logic needed for creating from webhook (unlikely if flow is strict)
                // We should log this.
                console.warn(`Subscription not found for activated event: ${subData.id}`);
                // Try to find by customer? No, potentially ambiguous.
                // It might be 'pending' with that ID.
            } else {
                // Update status
                // Razorpay status can be 'active' even in trial. checks `start_at` vs `charge_at`.

                // If trial is active
                const isTrial = subData.start_at && subData.start_at > (Date.now() / 1000); // Rough check? 
                // Better: check our own logic or `trial_end` from razorpay if available, but razorpay subscription entity doesn't always have simple 'trial' flag.
                // We trust our DB 'trialEndsAt' if we set it.
                // But we should sync.

                // We'll set status to 'active' or 'trialing'.
                // If created with trial, it's trialing.

                subscription.status = subscription.trialEndsAt && subscription.trialEndsAt > new Date() ? 'trialing' : 'active';
                subscription.razorpayCustomerId = subData.customer_id;
                subscription.startDate = new Date(subData.start_at * 1000);
                subscription.endDate = new Date(subData.end_at * 1000); // This is usually current cycle end
                subscription.autoRenew = true;
                subscription.autopayEnabled = true; // Activated means mandate is active

                await subscription.save();

                // Update User
                await User.findByIdAndUpdate(subscription.userId, {
                    subscriptionStatus: subscription.status,
                    subscriptionTier: subscription.planId ? 'creator_pro' : 'creator', // Derive from plan? Or just 'pro'
                    trialUsed: true,
                    razorpaySubscriptionId: subData.id,
                    activeSubscription: subscription._id,
                    plan: 'creator' // or 'creator_pro' based on price?
                });
            }

        } else if (event.event === 'subscription.charged') {
            const subData = payload.subscription.entity;
            const paymentData = payload.payment.entity;

            // Extend subscription
            const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });
            if (subscription) {
                subscription.status = 'active'; // No longer trialing if charged
                subscription.endDate = new Date(subData.end_at * 1000);
                subscription.lastPaymentId = paymentData.id;
                subscription.renewalCount += 1;
                subscription.trialEndsAt = undefined; // Clear trial if charged
                await subscription.save();

                await User.findByIdAndUpdate(subscription.userId, {
                    subscriptionStatus: 'active',
                    subscriptionEndAt: subscription.endDate
                });
            }

        } else if (['subscription.halted', 'subscription.cancelled', 'subscription.paused', 'subscription.completed'].includes(event.event)) {
            const subData = payload.subscription.entity;
            const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });
            if (subscription) {
                subscription.status = event.event === 'subscription.cancelled' ? 'canceled' : 'past_due'; // halted/paused -> past_due usually
                if (event.event === 'subscription.completed') subscription.status = 'expired';

                subscription.autoRenew = false;
                await subscription.save();

                await User.findByIdAndUpdate(subscription.userId, {
                    subscriptionStatus: subscription.status
                });
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

