import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { WebhookEventLog } from '@/lib/models/WebhookEventLog';
import Order from '@/lib/models/Order';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        if (!await rateLimit(ip, 'paypal_webhook', 100, 60)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.json();
        const headers = req.headers;

        // PayPal Webhook ID from settings
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;

        if (!webhookId) {
            console.error('[PAYPAL WEBHOOK] PAYPAL_WEBHOOK_ID not configured');
            return NextResponse.json({ error: 'Config error' }, { status: 500 });
        }

        // Verify signature via PayPal API
        const isVerified = await verifyPayPalSignature(req, body, webhookId);

        if (!isVerified) {
            console.warn('[PAYPAL WEBHOOK] Signature verification failed');
            return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
        }

        await dbConnect();

        // Idempotency check
        const eventId = body.id;
        const existingEvent = await WebhookEventLog.findOne({ eventId });
        if (existingEvent) {
            return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        // Log event
        await WebhookEventLog.create({
            platform: 'paypal',
            eventId,
            eventType: body.event_type,
            payload: body,
            status: 'pending'
        });

        console.log(`[PAYPAL WEBHOOK] Received: ${body.event_type}`);

        switch (body.event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED': {
                const capture = body.resource;
                const orderId = capture.custom_id || capture.supplementary_data?.related_ids?.order_id;

                if (orderId) {
                    const order = await Order.findById(orderId);
                    if (order && order.paymentStatus !== 'paid') {
                        order.paymentStatus = 'paid';
                        order.status = 'completed';
                        order.paymentMethod = 'paypal';
                        order.paidAt = new Date();
                        await order.save();

                        // Trigger Digital Fulfillment
                        await DigitalDeliveryService.fulfillOrder(order._id.toString());
                        console.log(`[PAYPAL WEBHOOK] Order ${order.orderNumber} fulfilled.`);
                    }
                }
                break;
            }

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.FAILED': {
                const capture = body.resource;
                const orderId = capture.custom_id;
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
            { eventId },
            { status: 'processed', processed: true, processedAt: new Date() }
        );

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[PAYPAL WEBHOOK] Process Failure:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function verifyPayPalSignature(req: NextRequest, body: any, webhookId: string) {
    try {
        const authHeader = req.headers.get('Authorization'); // May not be present in webhooks
        // PayPal actually uses specific headers for webhook verification
        const transmissionId = req.headers.get('paypal-transmission-id');
        const transmissionTime = req.headers.get('paypal-transmission-time');
        const transmissionSig = req.headers.get('paypal-transmission-sig');
        const certUrl = req.headers.get('paypal-cert-url');

        if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl) {
            return false;
        }

        // Call PayPal API to verify the webhook signature
        // Requires Access Token
        const accessToken = await getPayPalAccessToken();

        const response = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                transmission_id: transmissionId,
                transmission_time: transmissionTime,
                cert_url: certUrl,
                auth_algo: req.headers.get('paypal-auth-algo'),
                transmission_sig: transmissionSig,
                webhook_id: webhookId,
                webhook_event: body
            })
        });

        const verificationResult = await response.json();
        return verificationResult.verification_status === 'SUCCESS';
    } catch (error) {
        console.error('[PAYPAL VERIFICATION ERROR]:', error);
        return false;
    }
}

async function getPayPalAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}
