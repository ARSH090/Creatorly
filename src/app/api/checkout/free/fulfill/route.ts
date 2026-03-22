import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';
import { errorResponse } from '@/types/api';
import { publicApiRateLimit } from '@/lib/security/global-ratelimit';

/**
 * POST /api/checkout/free/fulfill
 * Create and fulfill an order for a free product
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { productId, email } = body;

        // 0. Rate Limit
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const ratelimit = await publicApiRateLimit.limit(ip);
        if (!ratelimit.success) {
            return NextResponse.json(errorResponse('Too many requests. Please try again later.'), { status: 429 });
        }

        if (!productId || !email) {
            return NextResponse.json(errorResponse('Product ID and Email are required'), { status: 400 });
        }

        // 0b. Duplicate Check (Prevent spamming free downloads)
        const existingOrder = await Order.findOne({
            customerEmail: email.toLowerCase(),
            "items.productId": productId,
            status: 'completed'
        });
        if (existingOrder) {
            return NextResponse.json({
                success: true,
                orderId: existingOrder._id,
                message: 'You already have access to this product. Check your email.'
            });
        }

        // 1. Fetch Product
        const product = await Product.findById(productId);
        if (!product || product.pricingType !== 'free' || (product.pricing?.basePrice ?? 0) !== 0) {
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
        const { nanoid } = await import('nanoid');
        const orderNumber = `ORD-FREE-${nanoid(10).toUpperCase()}`;

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
            razorpayOrderId: `free_${nanoid(12)}` // Unique placeholder
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
