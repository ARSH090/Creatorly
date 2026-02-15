import { POST } from '@/app/api/payments/razorpay/webhook/route';
import { createTestRequest } from '@/tests/utils/api-test-utils';
import Order from '@/lib/models/Order';
import PaymentLog from '@/lib/models/PaymentLog';
import { connectToDatabase } from '@/lib/db/mongodb';
import crypto from 'crypto';

describe('Razorpay Webhook API', () => {
    let testOrder: any;

    beforeAll(async () => {
        await connectToDatabase();
        testOrder = await Order.create({
            razorpayOrderId: 'order_webhook_123',
            amount: 1000,
            currency: 'INR',
            status: 'pending',
            customerEmail: 'web@test.com',
            creatorId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            items: [{ productId: new mongoose.Types.ObjectId(), name: 'p', price: 1000, quantity: 1, type: 'digital' }]
        });
    });

    afterAll(async () => {
        await Order.deleteOne({ _id: testOrder._id });
        await PaymentLog.deleteMany({ orderId: testOrder._id });
    });

    it('should process payment.captured event', async () => {
        const payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_123',
                        order_id: 'order_webhook_123',
                        amount: 100000,
                        status: 'captured'
                    }
                }
            }
        };

        const body = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret')
            .update(body)
            .digest('hex');

        const req = createTestRequest({
            method: 'POST',
            headers: { 'x-razorpay-signature': signature },
            body: payload
        });

        const response = await POST(req);
        expect(response.status).toBe(200);

        const updated = await Order.findById(testOrder._id);
        expect(updated.status).toBe('success');
    });

    it('should reject invalid signature', async () => {
        const req = createTestRequest({
            method: 'POST',
            headers: { 'x-razorpay-signature': 'invalid' },
            body: { event: 'test' }
        });

        const response = await POST(req);
        expect(response.status).toBe(400); // Or 401 depending on impl
    });
});

import mongoose from 'mongoose';
