import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Subscription from '@/lib/models/Subscription';
import ProcessedWebhook from '@/lib/models/ProcessedWebhook';
import { sendPaymentConfirmationEmail, sendDownloadInstructionsEmail } from '@/lib/services/email';

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
                }
                break;
            }

            case 'subscription.activated': {
                const { id: subscriptionId } = payload.payload.subscription.entity;
                await Subscription.findOneAndUpdate(
                    { razorpaySubscriptionId: subscriptionId },
                    { status: 'active', activatedAt: new Date() }
                );
                break;
            }

            case 'subscription.charged': {
                // Handle renewal
                break;
            }

            case 'payment.failed': {
                const { order_id: razorpayOrderId } = payload.payload.payment.entity;
                await Order.findOneAndUpdate(
                    { razorpayOrderId },
                    { status: 'failed' }
                );
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
