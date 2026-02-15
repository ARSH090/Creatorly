import { POST } from '@/app/api/orders/create/route';
import { authenticatedRequest } from '@/tests/utils/api-test-utils';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

// Mock Razorpay
jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
        orders: {
            create: jest.fn().mockResolvedValue({ id: 'rzp_order_123', amount: 100000, currency: 'INR' })
        }
    }));
});

describe('POST /api/orders/create', () => {
    let customerUser: any;
    let testProduct: any;

    beforeAll(async () => {
        await connectToDatabase();
        customerUser = await User.findOneAndUpdate(
            { email: 'customer@example.com' },
            { firebaseUid: 'cust-uid', displayName: 'Customer', role: 'customer' },
            { upsert: true, new: true }
        );
        testProduct = await Product.create({
            creatorId: new Pointer('507f1f77bcf86cd799439011'),
            title: 'Order Test Product',
            price: 1000,
            status: 'published',
            description: 'd',
            fileName: 'f',
            fileUrl: 'u',
            fileSize: 0,
            fileType: 't'
        });
    });

    afterAll(async () => {
        await Order.deleteMany({ customerEmail: 'customer@example.com' });
        await Product.deleteOne({ _id: testProduct._id });
        await User.deleteOne({ _id: customerUser._id });
    });

    it('should create order and Razorpay intent', async () => {
        const req = await authenticatedRequest({
            method: 'POST',
            userId: customerUser._id.toString(),
            body: {
                productId: testProduct._id.toString(),
                customerEmail: 'customer@example.com',
                customerName: 'Test Customer',
            },
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.data.razorpayOrderId).toBe('rzp_order_123');
    });

    it('should reject order for draft product', async () => {
        const draft = await Product.create({
            creatorId: customerUser._id,
            title: 'Draft',
            status: 'draft',
            price: 100,
            description: 'd',
            fileName: 'f',
            fileUrl: 'u',
            fileSize: 0,
            fileType: 't'
        });

        const req = await authenticatedRequest({
            method: 'POST',
            userId: customerUser._id.toString(),
            body: {
                productId: draft._id.toString(),
                customerEmail: 'customer@example.com',
            },
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
        await Product.deleteOne({ _id: draft._id });
    });
});

// Helper for fake IDs
function Pointer(id: string) { return new mongoose.Types.ObjectId(id); }
import mongoose from 'mongoose';
