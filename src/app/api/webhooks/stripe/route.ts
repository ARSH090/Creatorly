import { NextRequest, NextResponse } from 'next/server';
import stripe from 'stripe';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { WebhookEventLog } from '@/lib/models/WebhookEventLog';
import Order from '@/lib/models/Order';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';
import { rateLimit } from '@/lib/utils/rate-limit';
import crypto from 'crypto';

const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-04-10' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    try {
        const payload = await req.text();
        const sig = req.headers.get('stripe-signature');
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        if (!await rateLimit(ip, 'stripe_webhook', 100, 60)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        if (!sig || !endpointSecret) {
            return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
        }

        let event: stripe.Event;

        try {
            event = stripeClient.webhooks.constructEvent(payload, sig, endpointSecret);
        } catch (err: any) {
            console.error(`[STRIPE WEBHOOK] Signature verification failed: ${err.message}`);
            return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
        }

        await dbConnect();

        // Idempotency check
        const existingEvent = await WebhookEventLog.findOne({ eventId: event.id });
        if (existingEvent) {
            return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        // Log event
        await WebhookEventLog.create({
            platform: 'stripe',
            eventId: event.id,
            eventType: event.type,
            payload: event,
            status: 'pending'
        });

        console.log(`[STRIPE WEBHOOK] Received: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed':
            case 'payment_intent.succeeded': {
                const session = event.data.object as any;
                const orderId = session.metadata?.orderId || session.client_reference_id;

                if (orderId) {
                    const order = await Order.findById(orderId);
                    if (order && order.paymentStatus !== 'paid') {
                        order.paymentStatus = 'paid';
                        order.status = 'completed';
                        order.paymentMethod = 'stripe';
                        order.paidAt = new Date();
                        await order.save();

                        // Trigger Digital Fulfillment
                        await DigitalDeliveryService.fulfillOrder(order._id.toString());
                        console.log(`[STRIPE WEBHOOK] Order ${order.orderNumber} fulfilled.`);
                    }
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const intent = event.data.object as any;
                const orderId = intent.metadata?.orderId;
                if (orderId) {
                    await Order.findByIdAndUpdate(orderId, {
                        status: 'failed',
                        paymentStatus: 'failed'
                    });
                }
                break;
            }
        }

        // Update log status
        await WebhookEventLog.findOneAndUpdate(
            { eventId: event.id },
            { status: 'processed', processed: true, processedAt: new Date() }
        );

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[STRIPE WEBHOOK] Process Failure:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
