
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Transaction from '@/lib/models/Transaction';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper to verify webhook signature
const verifyWebhookSignature = (body: string, signature: string, secret: string) => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
};

// POST /api/v1/webhooks/razorpay
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const signature = req.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
        }

        const bodyText = await req.text(); // Need raw body for signature verification

        if (!verifyWebhookSignature(bodyText, signature, secret)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(bodyText);
        const { payload } = event;
        const payment = payload.payment?.entity;
        const razorpayOrderId = payment?.order_id;

        if (!razorpayOrderId) {
            return NextResponse.json({ message: 'No order ID in payload, ignoring' });
        }

        const order = await Order.findOne({ razorpayOrderId });
        if (!order) {
            // Might be a payment not linked to an order? or delayed consistency
            console.warn(`Order not found for Razorpay Order ID: ${razorpayOrderId}`);
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Handle Events
        // event.event could be: 'payment.captured', 'payment.failed', 'order.paid'

        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            if (order.status !== 'completed' && order.paymentStatus !== 'paid') {
                order.status = 'completed';
                order.paymentStatus = 'paid';
                order.paidAt = new Date();
                order.razorpayPaymentId = payment.id;
                await order.save();

                await Transaction.create({
                    orderId: order._id,
                    gateway: 'razorpay',
                    gatewayTransactionId: payment.id,
                    amount: payment.amount / 100, // convert back to main unit if needed, or keep consistent
                    currency: payment.currency,
                    status: 'success',
                    eventType: 'payment',
                    gatewayResponse: event
                });
            }
        } else if (event.event === 'payment.failed') {
            order.status = 'failed';
            order.paymentStatus = 'failed';
            await order.save();

            await Transaction.create({
                orderId: order._id,
                gateway: 'razorpay',
                gatewayTransactionId: payment.id,
                amount: payment.amount / 100,
                currency: payment.currency,
                status: 'failed',
                eventType: 'payment',
                gatewayResponse: event
            });
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
