import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Subscription from '@/lib/models/Subscription';
import Booking from '@/lib/models/Booking';
import ProcessedWebhook from '@/lib/models/ProcessedWebhook';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import User from '@/lib/models/User';
import { recordSecurityEvent, SecurityEventType } from '@/lib/security/monitoring';
import { NextResponse } from 'next/server';
import {
    verifyRazorpaySignature,
    preventWebhookReplay
} from '@/lib/security/payment-fraud-detection';
import {
    sendPaymentConfirmationEmail,
    sendDownloadInstructionsEmail
} from '@/lib/services/email';
import { notifyOrderCreated } from '@/lib/services/notifications';

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

        // 1. Handle One-Time Payments
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;

            // Amount and Currency Verification
            const order = await Order.findOne({ razorpayOrderId: payment.order_id });
            if (!order) {
                console.error(`❌ Order ${payment.order_id} not found for captured payment`);
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // Razorpay amount is in paise, Order amount is in INR
            const capturedAmountInINR = payment.amount / 100;
            if (capturedAmountInINR !== order.amount) {
                console.error(`🚨 FRAUD ALERT: Amount mismatch for order ${order._id}. Expected ${order.amount}, got ${capturedAmountInINR}`);
                order.status = 'failed'; // Mark as failed due to fraud attempt
                await order.save();
                return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
            }

            if (payment.currency !== order.currency) {
                console.error(`🚨 FRAUD ALERT: Currency mismatch for order ${order._id}. Expected ${order.currency}, got ${payment.currency}`);
                return NextResponse.json({ error: 'Currency mismatch' }, { status: 400 });
            }

            order.status = 'success';
            order.razorpayPaymentId = payment.id;
            order.razorpaySignature = signature;
            await order.save();

            // 3. Governance Alert: Check if Creator is suspended
            const creator = await User.findById(order.creatorId);
            if (creator && (creator.isSuspended || creator.status === 'suspended')) {
                console.error(`🚨 GOVERNANCE ALERT: Payment captured for SUSPENDED creator ${creator.username} (Order: ${order._id})`);
                await recordSecurityEvent(
                    SecurityEventType.ADMIN_ACTION,
                    {
                        alert: 'Payment Captured for Suspended Entity',
                        orderId: order._id,
                        creatorId: creator._id,
                        creatorUsername: creator.username,
                        amount: order.amount
                    },
                    req.headers.get('x-forwarded-for') || 'unknown',
                    creator._id.toString()
                );
            }

            // 3.5 Record Analytics Event (Conversion)
            try {
                await AnalyticsEvent.create({
                    eventType: 'purchase',
                    creatorId: order.creatorId,
                    productId: order.items[0]?.productId,
                    orderId: order._id,
                    path: '/checkout',
                    metadata: {
                        amount: order.amount,
                        currency: order.currency,
                        itemsCount: order.items.length
                    }
                });
            } catch (aErr) {
                console.error('Failed to record conversion analytics:', aErr);
                // Don't fail the webhook for analytics errors
            }

            // 4. Handle Fulfillment & Notifications

            // A. Send Receipt & Download Instructions
            await sendPaymentConfirmationEmail(
                order.customerEmail,
                order._id.toString(),
                order.amount,
                order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
            );

            const digitalItems = order.items.filter(i => i.type === 'digital' || i.type === 'course');
            if (digitalItems.length > 0) {
                await sendDownloadInstructionsEmail(
                    order.customerEmail,
                    order._id.toString(),
                    digitalItems.map(i => ({ name: i.name, productId: i.productId.toString() }))
                );
            }

            // B. Notify Creator
            await notifyOrderCreated(
                order.creatorId.toString(),
                order._id.toString(),
                order.amount,
                order.items[0]?.name || 'Product'
            );

            // C. Handle Booking Confirmation
            if (order.metadata?.bookingId) {
                const booking = await Booking.findById(order.metadata.bookingId);
                if (booking) {
                    booking.status = 'confirmed';
                    // Store payment link in booking
                    booking.meetLink = `https://meet.google.com/placeholder-${booking._id}`; // Placeholder 
                    await booking.save();
                    console.log(`📅 Booking ${booking._id} confirmed for order ${order._id}`);
                }
            }

            // D. Enroll in 'purchase' email sequence if exists
            try {
                const { enrollInSequence } = await import('@/lib/services/marketing');
                await enrollInSequence(order.customerEmail, order.creatorId.toString(), 'purchase');
            } catch (seqErr) {
                console.error('Sequence enrollment error:', seqErr);
            }

            // D. Decrement Stock for products
            try {
                const Product = (await import('@/lib/models/Product')).default;
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(item.productId, {
                        $inc: { stock: -item.quantity }
                    }, {
                        // Only decrement if stock is not null (unlimited)
                        condition: { stock: { $ne: null } }
                    });
                }
            } catch (sErr) {
                console.error('Stock decrement error:', sErr);
            }

            console.log(`✅ Order ${payment.order_id} captured and verified`);
        }

        // 2. Handle Subscription Events
        if (event.event === 'subscription.activated') {
            const sub = event.payload.subscription.entity;
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: sub.id },
                {
                    status: 'active',
                    startDate: new Date(sub.current_start * 1000),
                    endDate: new Date(sub.current_end * 1000)
                }
            );
            console.log(`✅ Subscription ${sub.id} activated`);
        }

        if (event.event === 'subscription.charged') {
            const sub = event.payload.subscription.entity;
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: sub.id },
                {
                    status: 'active',
                    startDate: new Date(sub.current_start * 1000),
                    endDate: new Date(sub.current_end * 1000),
                    $inc: { renewalCount: 1 }
                }
            );
            console.log(`💰 Subscription ${sub.id} charged/renewed`);
        }

        if (event.event === 'subscription.cancelled') {
            const sub = event.payload.subscription.entity;
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: sub.id },
                { status: 'canceled', autoRenew: false }
            );
            console.log(`❌ Subscription ${sub.id} cancelled`);
        }

        if (event.event === 'subscription.expired' || event.event === 'subscription.halted') {
            const sub = event.payload.subscription.entity;
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: sub.id },
                { status: 'expired' }
            );
            console.log(`⚠️ Subscription ${sub.id} expired/halted`);
        }


        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
