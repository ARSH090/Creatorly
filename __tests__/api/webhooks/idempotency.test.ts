import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import crypto from 'crypto';

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_123';
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

describe('Webhook idempotency — same event processed only once', () => {
    it('returns already_processed on second call with same event ID', async () => {
        const { WebhookEventLog } = await import('@/lib/models/WebhookEventLog');
        await WebhookEventLog.deleteMany({});

        const eventId = `evt_idempotency_test_${Date.now()}`;
        const event = {
            id: eventId,
            event: 'payment.captured',
            payload: {
                payment: { entity: { id: 'pay_test_123', order_id: 'order_test_abc' } },
            },
        };

        const body = JSON.stringify(event);
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

        const makeReq = () =>
            new Request('http://localhost/api/webhooks/razorpay', {
                method: 'POST',
                body,
                headers: { 'x-razorpay-signature': sig, 'content-type': 'application/json' },
            });

        const { POST } = await import('@/app/api/webhooks/razorpay/route');

        // First call — creates event log entry
        const res1 = await POST(makeReq() as any);
        expect([200, 404]).toContain(res1.status); // 404 = order not found in test DB, that's fine

        // Second call with identical event — must be deduplicated
        const res2 = await POST(makeReq() as any);
        const data2 = await res2.json();
        expect(data2.status).toBe('already_processed');

        // Exactly one log entry
        const count = await WebhookEventLog.countDocuments({ eventId });
        expect(count).toBe(1);
    });
});
