import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Subscription from '@/lib/models/Subscription';
import ProcessedWebhook from '@/lib/models/ProcessedWebhook';
import { NextResponse } from 'next/server';
import {
    verifyRazorpaySignature,
    preventWebhookReplay
} from '@/lib/security/payment-fraud-detection';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const webhookId = req.headers.get('x-razorpay-event-id');

        if (!signature || !webhookId) {
            return NextResponse.json({ error: 'Missing security headers' }, { status: 400 });
        }

        // 1. Signature Verification
        if (!verifyRazorpaySignature(body, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        await connectToDatabase();

        // 2. Event Idempotency (Database-level)
        const alreadyProcessed = await ProcessedWebhook.findOne({ webhookId });
        if (alreadyProcessed) {
            console.log(`⚠️ Webhook ${webhookId} already processed. Skipping.`);
            return NextResponse.json({ received: true, message: 'Already processed' });
        }

        // 3. Replay Protection (Memory-level for rapid bursts)
        if (!preventWebhookReplay(webhookId)) {
            return NextResponse.json({ error: 'Webhook replay detected' }, { status: 409 });
        }

        const event = JSON.parse(body);

        // Mark as processed BEFORE handling logic to avoid race conditions
        await ProcessedWebhook.create({
            webhookId,
            event: event.event,
        });

        // Continue with event handling...

        // 1. Handle One-Time Payments
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            await Order.findOneAndUpdate(
                { razorpayOrderId: payment.order_id },
                { status: 'success', razorpayPaymentId: payment.id }
            );
            console.log(`✅ Order ${payment.order_id} captured`);
        }

        // 2. Handle Subscription Events
        if (event.event === 'subscription.activated') {
            const sub = event.payload.subscription.entity;
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: sub.id },
                { status: 'active', currentStart: new Date(sub.current_start * 1000), currentEnd: new Date(sub.current_end * 1000) }
            );
        }

        if (event.event === 'subscription.charged') {
            const sub = event.payload.subscription.entity;
            const payment = event.payload.payment.entity;
            // You could create a recurring revenue log/order here
            console.log(`💰 Subscription recurring payment for ${sub.id}`);
        }

        if (event.event === 'subscription.cancelled') {
            const sub = event.payload.subscription.entity;
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: sub.id },
                { status: 'cancelled' }
            );
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
