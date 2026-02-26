import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import WebhookEndpoint from '@/lib/models/WebhookEndpoint';
import WebhookDelivery from '@/lib/models/WebhookDelivery';
import { getMongoUser } from '@/lib/auth/get-user';
import { createHmacSignature } from '@/lib/utils/webhooks';

export const dynamic = 'force-dynamic';

// POST /api/v1/webhooks/:id/retry/:deliveryId
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string, deliveryId: string } }
) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const endpoint = await WebhookEndpoint.findOne({ _id: params.id, creatorId: user._id });
        if (!endpoint) return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });

        const delivery = await WebhookDelivery.findOne({ _id: params.deliveryId, endpointId: endpoint._id });
        if (!delivery) return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });

        const signature = createHmacSignature(endpoint.secret, delivery.payload);

        delivery.attemptCount += 1;
        delivery.nextRetryAt = undefined; // Clear pending auto-retry

        try {
            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Creatorly-Signature': signature,
                    'X-Creatorly-Event': delivery.eventType
                },
                body: JSON.stringify(delivery.payload),
                signal: AbortSignal.timeout(10000)
            });

            const responseBody = await response.text();

            delivery.responseCode = response.status;
            delivery.responseBody = responseBody.substring(0, 1000);
            if (response.ok) {
                delivery.deliveredAt = new Date();
            }
            await delivery.save();

            return NextResponse.json({
                success: response.ok,
                statusCode: response.status,
                responseBody: delivery.responseBody
            });

        } catch (err: any) {
            delivery.responseBody = err.message;
            await delivery.save();
            return NextResponse.json({
                success: false,
                error: err.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error retrying webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
