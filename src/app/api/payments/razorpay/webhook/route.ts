import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Subscription from '@/lib/models/Subscription';
import ProcessedWebhook from '@/lib/models/ProcessedWebhook';
import { sendPaymentConfirmationEmail, sendDownloadInstructionsEmail } from '@/lib/services/email';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';


export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
        }

        // 1. Verify Signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('[Webhook] Invalid Razorpay signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const payload = JSON.parse(body);
        const event = payload.event;
        const eventId = payload.account_id + '_' + payload.created_at; // Unique event ID

        await connectToDatabase();

        // 2. Idempotency Check
        const alreadyProcessed = await ProcessedWebhook.findOne({ webhookId: eventId });
        if (alreadyProcessed) {
            return NextResponse.json({ message: 'Event already processed' });
        }

        // 2b. Secondary Payload-based Idempotency (CTO Hardening)
        if (event === 'order.paid') {
            const { id: rzpOrderId } = payload.payload.order.entity;
            const existingOrder = await Order.findOne({ razorpayOrderId: rzpOrderId });
            if (existingOrder && existingOrder.status === 'success') {
                return NextResponse.json({ message: 'Order already confirmed' });
            }
        }

        console.log(`[Webhook] Processing Razorpay event: ${event}`);

        // 3. Handle Events
        switch (event) {
            case 'order.paid': {
                const { id: razorpayOrderId } = payload.payload.order.entity;
                const { id: paymentId } = payload.payload.payment.entity;

                // Update Order Status
                const order = await Order.findOneAndUpdate(
                    { razorpayOrderId },
                    {
                        status: 'success',
                        razorpayPaymentId: paymentId,
                        razorpaySignature: signature // Technically not the window signature but good for audit
                    },
                    { new: true }
                );

                if (order) {
                    console.log(`[Webhook] Order ${order._id} confirmed for ${order.customerEmail}`);

                    // Trigger Transactional Emails
                    const items = order.items.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        productId: item.productId.toString()
                    }));

                    await sendPaymentConfirmationEmail(
                        order.customerEmail,
                        order._id.toString(),
                        order.amount,
                        items
                    );

                    await sendDownloadInstructionsEmail(
                        order.customerEmail,
                        order._id.toString(),
                        items
                    );

                    await AnalyticsEvent.create({
                        eventType: 'purchase',
                        creatorId: order.creatorId,
                        orderId: order._id,
                        amount: order.amount,
                        path: '/webhook/razorpay',
                        metadata: { razorpayOrderId, paymentId }
                    });

                    // 🟢 IN-APP NOTIFICATION: Notify the creator of a new sale
                    try {
                        const { NotificationService } = await import('@/lib/services/notification');
                        await NotificationService.send({
                            userId: order.creatorId.toString(),
                            type: 'payment_success',
                            title: 'New Sale! 💰',
                            message: `You just received a payment of ₹${order.amount} from ${order.customerEmail}.`,
                            link: `/dashboard/orders/${order._id}`
                        });
                    } catch (e) {
                        console.error('Failed to send sale notification:', e);
                    }
                }


                break;
            }

            case 'subscription.activated': {
                const { id: subscriptionId, customer_id: rzpCustomerId } = payload.payload.subscription.entity;
                const sub = await Subscription.findOneAndUpdate(
                    { razorpaySubscriptionId: subscriptionId },
                    { status: 'active', activatedAt: new Date(), razorpayCustomerId: rzpCustomerId },
                    { new: true }
                );

                if (sub) {
                    // Update User to link this subscription
                    const User = (await import('@/lib/models/User')).default;
                    await User.findByIdAndUpdate(sub.userId, {
                        activeSubscription: sub._id,
                        status: 'active' // Ensure user is active
                    });
                    console.log(`[Webhook] User ${sub.userId} linked to active subscription ${sub._id}`);

                    // Log Analytics Event
                    await AnalyticsEvent.create({
                        eventType: 'subscription',
                        creatorId: sub.userId, // Subscriptions are user-level
                        productId: sub.productId,
                        metadata: { subscriptionId, razorpayCustomerId: rzpCustomerId }
                    });
                }

                break;
            }


            case 'subscription.charged': {
                const { id: subscriptionId } = payload.payload.subscription.entity;
                const { id: paymentId } = payload.payload.payment.entity;

                // Handle renewal: Extend endDate and update status
                const subscription = await Subscription.findOneAndUpdate(
                    { razorpaySubscriptionId: subscriptionId },
                    {
                        status: 'active',
                        lastPaymentId: paymentId,
                        $inc: { renewalCount: 1 }
                    },
                    { new: true }
                );

                if (subscription) {
                    // Extend by another period (monthly/yearly)
                    const days = subscription.billingPeriod === 'yearly' ? 365 : 30;
                    subscription.endDate = new Date(subscription.endDate.getTime() + days * 24 * 60 * 60 * 1000);
                    await subscription.save();
                    console.log(`[Webhook] Subscription ${subscriptionId} renewed until ${subscription.endDate}`);
                }
                break;
            }

            case 'subscription.cancelled': {
                const { id: subscriptionId } = payload.payload.subscription.entity;
                await Subscription.findOneAndUpdate(
                    { razorpaySubscriptionId: subscriptionId },
                    { status: 'canceled', autoRenew: false }
                );
                console.log(`[Webhook] Subscription ${subscriptionId} cancelled`);
                break;
            }

            case 'refund.processed': {
                const { id: refundId, order_id: razorpayOrderId, amount } = payload.payload.refund.entity;
                await Order.findOneAndUpdate(
                    { razorpayOrderId },
                    {
                        status: 'refunded',
                        refundStatus: 'COMPLETED',
                        refund: {
                            amount: amount / 100, // Convert from paise
                            status: 'completed',
                            processedAt: new Date(),
                            refundId: refundId
                        }
                    }
                );
                console.log(`[Webhook] Refund processed for order ${razorpayOrderId}`);
                break;
            }


            case 'payment.failed': {
                const { order_id: razorpayOrderId } = payload.payload.payment.entity;
                const order = await Order.findOneAndUpdate(
                    { razorpayOrderId },
                    { status: 'failed' },
                    { new: true }
                );

                if (order) {
                    const { sendPaymentFailureEmail } = await import('@/lib/services/email');
                    await sendPaymentFailureEmail(order.customerEmail, order._id.toString());
                    console.log(`[Webhook] Payment failure email sent to ${order.customerEmail}`);
                }
                break;
            }

        }

        // 4. Record Event as Processed
        await ProcessedWebhook.create({ webhookId: eventId, event: event });

        return NextResponse.json({ status: 'ok' });

    } catch (error: any) {
        console.error('Razorpay Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
