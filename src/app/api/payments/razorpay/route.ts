import { razorpay } from '@/lib/payments/razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Subscription from '@/lib/models/Subscription';
import Product from '@/lib/models/Product';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/firebase/withAuth';

export const POST = withAuth(async (req, user) => {
    try {
        const { amount, currency = 'INR', productId, creatorId, customerEmail } = await req.json();

        if (!productId || !creatorId || !customerEmail) {
            return NextResponse.json({ error: 'Missing required checkout fields' }, { status: 400 });
        }

        await connectToDatabase();
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Handle Subscriptions
        if (product.paymentType === 'subscription' && product.razorpayPlanId) {
            const rzpSubscription = await razorpay.subscriptions.create({
                plan_id: product.razorpayPlanId,
                total_count: 12,
                quantity: 1,
                customer_notify: true,
            }) as any;

            await Subscription.create({
                userId: user._id, // Use authenticated user ID
                productId: product._id,
                originalPrice: product.price,
                discountAmount: 0,
                finalPrice: product.price,
                billingPeriod: product.billingCycle || 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + (product.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
                status: 'pending',
                razorpaySubscriptionId: rzpSubscription.id
            });

            return NextResponse.json({
                subscriptionId: rzpSubscription.id,
                isSubscription: true
            });
        }

        // Handle One-Time Payments
        const options = {
            amount: Math.round((amount || product.price) * 100),
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const rzpOrder = await razorpay.orders.create(options);

        await Order.create({
            productId,
            creatorId,
            userId: user._id,
            customerEmail,
            amount: amount || product.price,
            razorpayOrderId: rzpOrder.id,
            status: 'pending'
        });

        return NextResponse.json({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            isSubscription: false
        });
    } catch (error: any) {
        console.error('Razorpay checkout error:', error);
        return NextResponse.json({ error: 'Failed to initiate checkout' }, { status: 500 });
    }
});
