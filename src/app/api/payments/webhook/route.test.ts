
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import Subscription from '@/lib/models/Subscription';
import { connectToDatabase } from '@/lib/db/mongodb';

// Mock dependencies
vi.mock('@/lib/db/mongodb', () => ({
    connectToDatabase: vi.fn(),
}));

vi.mock('@/lib/models/Subscription', () => ({
    default: {
        findOneAndUpdate: vi.fn(),
    }
}));

vi.mock('@/lib/models/ProcessedWebhook', () => ({
    default: {
        findOne: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
    }
}));

vi.mock('@/lib/security/payment-fraud-detection', () => ({
    verifyRazorpaySignature: vi.fn().mockReturnValue(true),
    preventWebhookReplay: vi.fn().mockReturnValue(true),
}));

describe('Subscription Webhook Endpoint', () => {
    const WEBHOOK_SECRET = 'placeholder';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle subscription.charged event', async () => {
        const payload = JSON.stringify({
            event: 'subscription.charged',
            payload: {
                subscription: { entity: { id: 'sub_123', plan_id: 'plan_123' } },
                payment: { entity: { id: 'pay_123', amount: 50000 } }
            }
        });

        const req = new NextRequest('http://localhost/api/payments/webhook', {
            method: 'POST',
            helpers: {}, // vitest might need this or not
            body: payload,
            headers: {
                'x-razorpay-signature': 'valid_sig',
                'x-razorpay-event-id': 'evt_123'
            }
        } as any);

        const res = await POST(req);
        const json = await res.json();

        expect(json.received).toBe(true);
        // We mocked findOneAndUpdate, so we just verify it was called?
        // Actually the code logs for 'subscription.charged', but 'subscription.activated' calls DB.
    });

    it('should activate subscription on subscription.activated', async () => {
        const payload = JSON.stringify({
            event: 'subscription.activated',
            payload: {
                subscription: {
                    entity: {
                        id: 'sub_123',
                        current_start: 1715420000,
                        current_end: 1718090000
                    }
                }
            }
        });

        const req = new NextRequest('http://localhost/api/payments/webhook', {
            method: 'POST',
            body: payload,
            headers: {
                'x-razorpay-signature': 'valid_sig',
                'x-razorpay-event-id': 'evt_456'
            }
        } as any);

        await POST(req);

        expect(Subscription.findOneAndUpdate).toHaveBeenCalledWith(
            { razorpaySubscriptionId: 'sub_123' },
            expect.objectContaining({ status: 'active' })
        );
    });

    it('should cancel subscription on subscription.cancelled', async () => {
        const payload = JSON.stringify({
            event: 'subscription.cancelled',
            payload: {
                subscription: { entity: { id: 'sub_123' } }
            }
        });

        const req = new NextRequest('http://localhost/api/payments/webhook', {
            method: 'POST',
            body: payload,
            headers: {
                'x-razorpay-signature': 'valid_sig',
                'x-razorpay-event-id': 'evt_789'
            }
        } as any);

        await POST(req);

        expect(Subscription.findOneAndUpdate).toHaveBeenCalledWith(
            { razorpaySubscriptionId: 'sub_123' },
            expect.objectContaining({ status: 'cancelled' })
        );
    });
});
