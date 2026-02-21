import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { Payment } from '@/lib/models/Payment';
import { Invoice } from '@/lib/models/Invoice';
import { WebhookEventLog } from '@/lib/models/WebhookEventLog';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Protocol violation: Missing signature' }, { status: 400 });
        }

        await dbConnect();

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error('CRITICAL: Razorpay Webhook Secret not configured');
            return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return NextResponse.json({ error: 'Unauthorized: Invalid protocol signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        const payload = event.payload;

        // 1. Idempotency Check
        const existingEvent = await WebhookEventLog.findOne({ eventId: event.id });
        if (existingEvent) {
            return NextResponse.json({ status: 'already_processed' });
        }

        console.log(`[RAZORPAY WEBHOOK] Processing: ${event.event}`);

        // 2. Event Dispatcher
        switch (event.event) {
            case 'subscription.activated': {
                const subData = payload.subscription.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });

                if (subscription) {
                    subscription.status = 'active';
                    subscription.razorpayCustomerId = subData.customer_id;
                    subscription.startDate = new Date(subData.start_at * 1000);
                    subscription.endDate = new Date(subData.end_at * 1000);
                    await subscription.save();

                    await User.findByIdAndUpdate(subscription.userId, {
                        subscriptionStatus: 'active',
                        subscriptionTier: 'pro'
                    });
                }
                break;
            }

            case 'subscription.charged': {
                const subData = payload.subscription.entity;
                const paymentData = payload.payment.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });

                if (subscription) {
                    // Update Subscription
                    subscription.status = 'active';
                    subscription.endDate = new Date(subData.end_at * 1000);
                    subscription.lastPaymentId = paymentData.id;
                    subscription.renewalCount += 1;
                    await subscription.save();

                    // Record Payment
                    const payment = await Payment.create({
                        userId: subscription.userId,
                        subscriptionId: subscription._id,
                        razorpayPaymentId: paymentData.id,
                        amount: paymentData.amount, // in paise
                        status: 'captured',
                        currency: paymentData.currency
                    });

                    // Generate Invoice
                    await Invoice.create({
                        userId: subscription.userId,
                        subscriptionId: subscription._id,
                        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        amount: paymentData.amount / 100,
                        issuedAt: new Date()
                    });

                    await User.findByIdAndUpdate(subscription.userId, {
                        subscriptionStatus: 'active',
                        subscriptionEndAt: subscription.endDate
                    });
                }
                break;
            }

            case 'payment.captured': {
                const payment = payload.payment.entity;
                const razorpayOrderId = payment.order_id;
                const order = await Order.findOne({ razorpayOrderId });

                if (order && order.status !== 'completed') {
                    order.status = 'completed';
                    order.paymentStatus = 'paid';
                    order.razorpayPaymentId = payment.id;
                    order.paidAt = new Date();
                    await order.save();
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.expired': {
                const subData = payload.subscription.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });
                if (subscription) {
                    subscription.status = event.event === 'subscription.cancelled' ? 'canceled' : 'expired';
                    subscription.autoRenew = false;
                    await subscription.save();

                    await User.findByIdAndUpdate(subscription.userId, {
                        subscriptionStatus: subscription.status
                    });
                }
                break;
            }

            case 'subscription.paused':
            case 'subscription.halted': {
                const subData = payload.subscription.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });
                if (subscription) {
                    subscription.status = 'past_due';
                    await subscription.save();

                    await User.findByIdAndUpdate(subscription.userId, {
                        subscriptionStatus: 'past_due'
                    });
                }
                break;
            }
        }

        // 3. Log Event for Idempotency
        await WebhookEventLog.create({
            platform: 'razorpay',
            eventId: event.id,
            eventType: event.event,
            payloadHash: crypto.createHash('sha256').update(body).digest('hex'),
            payload: event,
            status: 'processed',
            processed: true,
            processedAt: new Date()
        });

        return NextResponse.json({ status: 'ok' });

    } catch (error: any) {
        console.error('CRITICAL Webhook Process Failure:', error);
        return NextResponse.json({ error: 'Protocol Execution Error' }, { status: 500 });
    }
}

