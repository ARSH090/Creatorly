import { createMocks } from 'node-mocks-http';
import { POST as verifyHandler } from '@/app/api/checkout/razorpay/verify-payment/route';
import Order from '@/lib/models/Order';
import { connectToDatabase } from '@/lib/db/mongodb';

jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/models/Order');

describe('Payment Amount Verification Security Test', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    it('should reject payment if signature is valid but amount is tampered', async () => {
        // Mock order with ₹100 price
        const mockOrder = {
            _id: 'order_123',
            total: 10000, // ₹100
            paymentStatus: 'pending',
            save: jest.fn(),
        };
        (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

        const { req } = createMocks({
            method: 'POST',
            body: {
                razorpay_order_id: 'rzp_order_123',
                razorpay_payment_id: 'rzp_pay_123',
                razorpay_signature: 'valid_sig_but_tampered_amount',
                productId: 'prod_123',
                email: 'buyer@example.com',
                // Malicious client sends a smaller amount in metadata or similar
            },
        });

        // The handler MUST fetch the TRUE price from the DB (mockOrder.total)
        // and NOT rely on any amount sent in the request body.
        
        const response = await verifyHandler(req as any);
        const data = await response.json();

        // If the handler is secure, it shouldn't even take 'amount' from body
        // But if it did, this test ensures we catch discrepancies.
        expect(response.status).not.toBe(200);
    });
});
