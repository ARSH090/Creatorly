import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { capturePayPalOrder } from '@/lib/payments/paypal';
import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { orderId, productId, email, customerName } = await req.json();

        const captureData = await capturePayPalOrder(orderId);

        if (captureData.status === 'COMPLETED') {
            const product = await Product.findById(productId);
            if (!product) throw new Error('Product not found');

            // Find or Create User
            let buyer = await User.findOne({ email: email.toLowerCase() });
            if (!buyer) {
                buyer = await User.create({
                    email: email.toLowerCase(),
                    fullName: customerName,
                    userType: 'buyer'
                });
            }

            // Create global Order
            const orderNumber = `ORD-PP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const amount = parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value);

            const order = await Order.create({
                orderNumber,
                items: [{
                    productId: product._id,
                    name: product.title,
                    price: amount,
                    quantity: 1,
                    type: product.productType
                }],
                creatorId: product.creatorId,
                userId: buyer._id,
                customerEmail: email,
                amount,
                total: amount,
                currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
                status: 'completed',
                paymentStatus: 'paid',
                paymentGateway: 'paypal',
                paidAt: new Date()
            });

            // Trigger Fulfillment
            await DigitalDeliveryService.fulfillOrder(order._id.toString());

            // --- P0 WIRING ---
            const { getOrCreateSubscriber, applyPurchaseTags } = await import('@/lib/utils/tags');
            const { dispatchWebhook } = await import('@/lib/utils/webhooks');
            const { recordConversion } = await import('@/lib/utils/analytics');

            const subscriber = await getOrCreateSubscriber(product.creatorId.toString(), email, customerName, 'paypal');
            await applyPurchaseTags(product.creatorId.toString(), subscriber._id.toString(), product._id.toString());

            await dispatchWebhook(product.creatorId.toString(), 'purchase.completed', {
                orderId: order._id,
                product: { id: product._id, title: product.title },
                amount
            });

            await recordConversion(product.creatorId.toString(), 'paypal', amount);

            return NextResponse.json({ success: true, orderId: order._id });
        }

        return NextResponse.json({ success: false, status: captureData.status });
    } catch (error: any) {
        console.error('PayPal Capture Order Error:', error);
        return NextResponse.json({ error: 'Failed to capture PayPal order' }, { status: 500 });
    }
}
