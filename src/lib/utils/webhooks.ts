import crypto from 'crypto';
import WebhookEndpoint from '@/lib/models/WebhookEndpoint';
import WebhookDelivery from '@/lib/models/WebhookDelivery';

/**
 * Creates an HMAC SHA256 signature for the webhook payload
 */
export function createHmacSignature(secret: string, payload: any): string {
    const body = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Dispatches a webhook event to all active endpoints subscribed to the event type
 */
export async function dispatchWebhook(creatorId: string, eventType: string, payload: any) {
    try {
        // 1. Find all active endpoints for creatorId subscribed to eventType
        const endpoints = await WebhookEndpoint.find({
            creatorId,
            isActive: true,
            events: eventType
        });

        if (endpoints.length === 0) return;

        // 2. For each endpoint, create delivery record and send
        for (const endpoint of endpoints) {
            const signature = createHmacSignature(endpoint.secret, payload);

            // Create initial delivery record
            const delivery = await WebhookDelivery.create({
                endpointId: endpoint._id,
                eventType,
                payload,
                attemptCount: 1
            });

            try {
                const response = await fetch(endpoint.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Creatorly-Signature': signature,
                        'X-Creatorly-Event': eventType
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000) // 10s timeout
                });

                const responseBody = await response.text();

                // Update delivery record with result
                delivery.responseCode = response.status;
                delivery.responseBody = responseBody.substring(0, 1000); // Truncate long responses
                if (response.ok) {
                    delivery.deliveredAt = new Date();
                } else {
                    // Schedule retry
                    delivery.nextRetryAt = calculateNextRetry(1);
                }
                await delivery.save();

                // Update endpoint stats
                await WebhookEndpoint.findByIdAndUpdate(endpoint._id, {
                    lastDeliveryAt: new Date(),
                    lastStatusCode: response.status
                });

            } catch (err: any) {
                console.error(`Webhook delivery failed for ${endpoint.url}:`, err.message);
                delivery.responseBody = err.message;
                delivery.nextRetryAt = calculateNextRetry(1);
                await delivery.save();
            }
        }
    } catch (error) {
        console.error('Error in dispatchWebhook:', error);
    }
}

function calculateNextRetry(attempt: number): Date {
    // Exponential backoff: 5min, 30min, 2hr, 5hr, 10hr
    const backoffs = [5, 30, 120, 300, 600];
    const minutes = backoffs[attempt - 1] || 600;
    return new Date(Date.now() + minutes * 60000);
}
