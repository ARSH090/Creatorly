import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { getMongoUser } from '@/lib/auth/get-user';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { email, productId, name } = await req.json();

        if (!email || !productId) {
            return NextResponse.json({ error: 'Email and Product ID are required' }, { status: 400 });
        }

        const product = await Product.findOne({ _id: productId, creatorId: user._id });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Find or Create Buyer
        let buyer = await User.findOne({ email: email.toLowerCase() });
        if (!buyer) {
            buyer = await User.create({
                email: email.toLowerCase(),
                fullName: name || email.split('@')[0],
                userType: 'buyer'
            });
        }

        // Create Manual Order
        const orderNumber = `MANUAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const order = await Order.create({
            orderNumber,
            items: [{
                productId: product._id,
                name: product.title,
                price: 0,
                quantity: 1,
                type: product.productType
            }],
            creatorId: user._id,
            userId: buyer._id,
            customerEmail: email.toLowerCase(),
            amount: 0,
            total: 0,
            status: 'completed',
            paymentStatus: 'paid',
            paymentGateway: 'razorpay', // Placeholder to satisfy enum if needed, or update schema
            metadata: { manualGrant: true, grantedBy: user._id },
            paidAt: new Date()
        });

        // Trigger Fulfillment
        await DigitalDeliveryService.fulfillOrder(order._id.toString());

        // --- P0 WIRING ---
        const { getOrCreateSubscriber, applyPurchaseTags } = await import('@/lib/utils/tags');
        const { dispatchWebhook } = await import('@/lib/utils/webhooks');

        const subscriber = await getOrCreateSubscriber(user._id.toString(), email, name, 'manual_grant');
        await applyPurchaseTags(user._id.toString(), subscriber._id.toString(), product._id.toString());

        await dispatchWebhook(user._id.toString(), 'purchase.completed', {
            orderId: order._id,
            product: { id: product._id, title: product.title },
            isManual: true
        });

        return NextResponse.json({ success: true, orderId: order._id });

    } catch (error: any) {
        console.error('Manual Grant API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
