import { POST } from '@/app/api/orders/verify/route';
import { authenticatedRequest } from '@/tests/utils/api-test-utils';
import Order from '@/lib/models/Order';
import { connectToDatabase } from '@/lib/db/mongodb';
import crypto from 'crypto';
import mongoose from 'mongoose';

describe('POST /api/orders/verify', () => {
    let testOrder: any;

    beforeAll(async () => {
        await connectToDatabase();
        testOrder = await Order.create({
            razorpayOrderId: 'order_test_signature',
            amount: 1000,
            currency: 'INR',
            status: 'pending',
            customerEmail: 'verify@test.com',
            creatorId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            items: [{ productId: new mongoose.Types.ObjectId(), name: 'p', price: 1000, quantity: 1, type: 'digital' }]
        });
    });

    afterAll(async () => {
        await Order.deleteOne({ _id: testOrder._id });
    });

    it('should verify payment with valid signature', async () => {
        const rzpPaymentId = 'pay_verify_123';
        const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret';
        const signature = crypto
            .createHmac('sha256', secret)
            .update(`order_test_signature|${rzpPaymentId}`)
            .digest('hex');

        const req = await authenticatedRequest({
            method: 'POST',
            body: {
                orderId: testOrder._id.toString(),
                razorpayOrderId: 'order_test_signature',
                razorpayPaymentId: rzpPaymentId,
                razorpaySignature: signature,
            },
        });

        const response = await POST(req);
        expect(response.status).toBe(200);

        const updated = await Order.findById(testOrder._id);
        expect(updated.status).toBe('success');
    });

    it('should reject invalid signature', async () => {
        const req = await authenticatedRequest({
            method: 'POST',
            body: {
                orderId: testOrder._id.toString(),
                razorpayOrderId: 'order_test_signature',
                razorpayPaymentId: 'pay_wrong',
                razorpaySignature: 'bad_sig',
            },
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
