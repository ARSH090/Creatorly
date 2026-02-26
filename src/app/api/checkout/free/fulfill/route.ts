import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';
import { errorResponse } from '@/types/api';

/**
 * POST /api/checkout/free/fulfill
 * Create and fulfill an order for a free product
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { productId, email } = body;

        if (!productId || !email) {
            return NextResponse.json(errorResponse('Product ID and Email are required'), { status: 400 });
        }

        // 1. Fetch Product
        const product = await Product.findById(productId);
        if (!product || (product.pricingType !== 'free' && product.pricing?.basePrice !== 0)) {
            return NextResponse.json(errorResponse('This product is not free'), { status: 400 });
        }

        // 2. Find or Create User
        let buyer = await User.findOne({ email: email.toLowerCase() });
        if (!buyer) {
            buyer = await User.create({
                email: email.toLowerCase(),
                fullName: email.split('@')[0],
                userType: 'buyer',
                isEmailVerified: true
            });
        }

        // 3. Create Order
        const orderNumber = `ORD-FREE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const order = await Order.create({
            orderNumber,
            items: [{
                productId: product._id,
                name: product.title,
                price: 0,
                quantity: 1,
                type: product.productType
            }],
            creatorId: product.creatorId,
            userId: buyer._id,
            customerEmail: email.toLowerCase(),
            amount: 0,
            total: 0,
            currency: product.pricing?.currency || 'INR',
            status: 'completed',
            paymentStatus: 'paid', // Mark as paid since it's free
            paidAt: new Date(),
            paymentGateway: 'razorpay', // Placeholder to satisfy models if needed
            razorpayOrderId: `free_${Date.now()}` // Unique placeholder
        });

        // 4. Trigger Fulfillment
        await DigitalDeliveryService.fulfillOrder(order._id.toString());

        return NextResponse.json({
            success: true,
            orderId: order._id,
            message: 'Free product order fulfilled'
        });

    } catch (error: any) {
        console.error('Free Fulfill Error:', error);
        return NextResponse.json(errorResponse('Failed to fulfill free order', error.message), { status: 500 });
    }
}
