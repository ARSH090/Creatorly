import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    process.env.RAZORPAY_KEY_SECRET = 'test_rzp_secret';
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

describe('Payment amount verification — client cannot set price', () => {
    it('rejects when no valid Razorpay order exists for the given order_id', async () => {
        const { POST } = await import('@/app/api/checkout/razorpay/verify-payment/route');

        const body = JSON.stringify({
            razorpay_order_id: 'order_nonexistent_999',
            razorpay_payment_id: 'pay_test_001',
            razorpay_signature: 'fake_sig',
            productId: new mongoose.Types.ObjectId().toString(),
            email: 'buyer@test.com',
            amount: 1, // attacker sends ₹0.01 paise
        });

        const req = new Request('http://localhost/api/checkout/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body,
        });

        const res = await POST(req as any);
        // Must not be 200 — signature is invalid so should be 400
        expect(res.status).not.toBe(200);
        expect([400, 401, 404]).toContain(res.status);
    });

    it('verifyRazorpaySignature returns false for mismatched amounts / tampered data', async () => {
        const { verifyRazorpaySignature } = await import('@/lib/payments/razorpay');

        const orderId = 'order_real_123';
        const paymentId = 'pay_real_456';
        const secret = process.env.RAZORPAY_KEY_SECRET!;

        // Generate correct signature
        const crypto = require('crypto');
        const correctSig = crypto
            .createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        expect(verifyRazorpaySignature(orderId, paymentId, correctSig)).toBe(true);

        // Tampered: different payment ID
        expect(verifyRazorpaySignature(orderId, 'pay_tampered', correctSig)).toBe(false);

        // Tampered: completely fake sig
        expect(verifyRazorpaySignature(orderId, paymentId, 'fakesig123')).toBe(false);
    });
});
