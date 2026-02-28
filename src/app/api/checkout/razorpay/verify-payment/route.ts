import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import AbandonedCheckout from '@/lib/models/AbandonedCheckout';
import Coupon from '@/lib/models/Coupon';
import UpsellOffer from '@/lib/models/UpsellOffer';
import { verifyRazorpaySignature } from '@/lib/payments/razorpay';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';
import { enrollInSequence } from '@/lib/services/sequence-enroll';
import Subscriber from '@/lib/models/Subscriber';
import { errorResponse, successResponse } from '@/types/api';

/**
 * POST /api/checkout/razorpay/verify-payment
 * Verify Razorpay payment and fulfill digital order
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            productId,
            email,
            customerName,
            couponCode
        } = body;

        // 1. Verify Payment Signature
        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return NextResponse.json(errorResponse('Invalid payment signature'), { status: 400 });
        }

        // 2. Check Idempotency - Prevent duplicate processing if webhook already handled it
        const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
        if (existingOrder && existingOrder.status === 'completed') {
            return NextResponse.json({
                success: true,
                orderId: existingOrder._id,
                orderNumber: existingOrder.orderNumber,
                message: 'Payment already verified',
                accessToken: existingOrder.accessToken
            });
        }

        // 3. Fetch Product & Creator
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json(errorResponse('Product not found'), { status: 404 });
        }

        // 4. Find or Create User (Buyer)
        let buyer = await User.findOne({ email: email.toLowerCase() });
        if (!buyer) {
            buyer = await User.create({
                email: email.toLowerCase(),
                fullName: customerName || email.split('@')[0],
                userType: 'buyer',
                isEmailVerified: true
            });
        }

        // 5. Generate Access Token
        const { randomBytes } = await import('crypto');
        const accessToken = randomBytes(32).toString('hex');
        const accessTokenExpiry = new Date();
        accessTokenExpiry.setDate(accessTokenExpiry.getDate() + 30); // 30 days

        // 6. Create Order
        const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const amount = body.amount || (product.pricing?.salePrice || product.pricing?.basePrice || product.price || 0);

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
            customerEmail: email.toLowerCase(),
            customerName: customerName,
            amount,
            total: amount,
            currency: product.pricing?.currency || 'INR',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'completed',
            paymentStatus: 'paid',
            paidAt: new Date(),
            couponId: couponCode,
            accessToken,
            accessTokenExpiry
        });

        // 7. Update Subscriber Stats
        await Subscriber.findOneAndUpdate(
            { email: email.toLowerCase(), creatorId: product.creatorId },
            {
                $inc: { orderCount: 1, totalSpent: amount },
                $set: { name: customerName, status: 'active', source: 'checkout' }
            },
            { upsert: true }
        );

        // 8. Update Abandoned Checkout
        await AbandonedCheckout.findOneAndUpdate(
            { buyerEmail: email.toLowerCase(), productId: product._id, status: 'abandoned' },
            { status: 'recovered', recoveredAt: new Date() }
        );

        // 9. Increment Coupon Usage
        if (couponCode) {
            await Coupon.findOneAndUpdate(
                { code: couponCode.toUpperCase() },
                { $inc: { usedCount: 1, totalRevenueDriven: amount } }
            );
        }

        // 10. Success Response
        const upsell = await UpsellOffer.findOne({ triggerProductId: product._id, isActive: true });
        let finalRedirectUrl = null;
        if (upsell) {
            finalRedirectUrl = `/upsell/${upsell._id}?session=${order._id}`;
        }

        const response = NextResponse.json({
            success: true,
            orderId: order._id,
            orderNumber: order.orderNumber,
            accessToken: order.accessToken,
            message: 'Payment verified and order fulfilled',
            redirectUrl: finalRedirectUrl
        });

        // 8. Background Processing (Fire-and-forget for instant UI response)
        (async () => {
            try {
                // Trigger Fulfillment
                await DigitalDeliveryService.fulfillOrder(order._id.toString());

                // Enroll buyer into sequences
                await enrollInSequence(email.toLowerCase(), product.creatorId.toString(), 'purchase', product._id.toString());

                // Affiliate Attribution
                const affiliateCode = req.cookies.get('affiliate_code')?.value;
                if (affiliateCode) {
                    const { attributeOrderToAffiliate } = await import('@/lib/utils/affiliates');
                    await attributeOrderToAffiliate(order._id.toString(), affiliateCode);
                }

                // P0 Wiring
                const { getOrCreateSubscriber, applyPurchaseTags } = await import('@/lib/utils/tags');
                const { dispatchWebhook } = await import('@/lib/utils/webhooks');
                const { triggerWorkflows } = await import('@/lib/utils/automations');

                const subscriber = await getOrCreateSubscriber(product.creatorId.toString(), email, customerName, 'checkout');
                await applyPurchaseTags(product.creatorId.toString(), subscriber._id.toString(), product._id.toString());
                await triggerWorkflows(product.creatorId.toString(), 'purchase', subscriber._id.toString(), { productId: product._id.toString() });

                await dispatchWebhook(product.creatorId.toString(), 'purchase.completed', {
                    orderId: order._id,
                    product: { id: product._id, title: product.title },
                    amount
                });

                const { recordConversion } = await import('@/lib/utils/analytics');
                const source = req.cookies.get('affiliate_code')?.value || 'direct';
                await recordConversion(product.creatorId.toString(), source, amount);

            } catch (bgError) {
                console.error('[Background-Verify-Payment] Error:', bgError);
            }
        })();

        return response;

    } catch (error: any) {
        console.error('Verify Payment Error:', error);
        return NextResponse.json(errorResponse('Failed to verify payment', error.message), { status: 500 });
    }
}

