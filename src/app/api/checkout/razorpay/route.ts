import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/payments/razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';
import { Coupon } from '@/lib/models/Coupon';
import { nanoid } from 'nanoid';

/**
 * POST /api/checkout/razorpay
 * Public endpoint for storefront buyers to initiate checkout.
 * Handles pricing, coupons, and Razorpay order creation.
 */
export async function POST(req: NextRequest) {
    try {
        const { productId, buyerEmail, buyerName, couponCode, metadata = {} } = await req.json();

        if (!productId || !buyerEmail) {
            return NextResponse.json({ error: 'Product ID and Email are required' }, { status: 400 });
        }

        await connectToDatabase();
        const product = await Product.findById(productId);

        if (!product || product.status !== 'active') {
            return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 404 });
        }

        const basePrice = product.pricing?.basePrice || product.price || 0;
        let discountAmount = 0;
        let couponId = null;

        // Apply coupon if provided
        if (couponCode) {
            const coupon = await Coupon.findOne({
                creatorId: product.creatorId,
                code: couponCode.toUpperCase(),
                isActive: true,
                status: 'active'
            });

            if (coupon) {
                const now = new Date();
                const isExpired = coupon.validUntil && coupon.validUntil < now;
                const isExhausted = coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit;

                if (!isExpired && !isExhausted) {
                    if (coupon.discountType === 'percentage') {
                        discountAmount = Math.floor(basePrice * (coupon.discountValue / 100));
                        if (coupon.maxDiscountCap) {
                            discountAmount = Math.min(discountAmount, coupon.maxDiscountCap);
                        }
                    } else if (coupon.discountType === 'fixed') {
                        discountAmount = Math.min(coupon.discountValue, basePrice);
                    }
                    couponId = coupon._id;
                }
            }
        }

        const finalAmount = Math.max(0, basePrice - discountAmount);

        // CREATE RAZORPAY ORDER
        const rzpOrder = await razorpay.orders.create({
            amount: finalAmount, // Final amount in paise
            currency: product.pricing?.currency || 'INR',
            receipt: `store_${nanoid(10)}`,
            notes: {
                productId: productId.toString(),
                creatorId: product.creatorId.toString(),
                customerEmail: buyerEmail
            }
        });

        // GENERATE ORDER NUMBER
        const orderNumber = `CR-${nanoid(8).toUpperCase()}`;

        // SAVE PENDING ORDER IN DB
        const order = await Order.create({
            orderNumber,
            items: [{
                productId: product._id,
                name: product.title || product.name,
                price: basePrice,
                quantity: 1,
                type: product.productType || product.type || 'digital_download'
            }],
            creatorId: product.creatorId,
            userId: product.creatorId, // Temporary pointer for unauthenticated buyers
            customerEmail: buyerEmail,
            customerName: buyerName,
            amount: basePrice,
            discountAmount,
            total: finalAmount,
            currency: product.pricing?.currency || 'INR',
            status: 'pending',
            paymentStatus: 'pending',
            razorpayOrderId: rzpOrder.id,
            couponId: couponId?.toString(),
            metadata: {
                ...metadata,
                source: 'storefront_checkout'
            }
        });

        return NextResponse.json({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            orderId: order._id,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error('[Checkout API] Error:', error);
        return NextResponse.json({ error: 'Checkout initiation failed', message: error.message }, { status: 500 });
    }
}
