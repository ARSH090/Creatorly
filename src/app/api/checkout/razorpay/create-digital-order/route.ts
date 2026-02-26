import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { validateCoupon } from '@/lib/services/couponValidator';
import { errorResponse } from '@/types/api';

/**
 * POST /api/checkout/razorpay/create-digital-order
 * Create a Razorpay order for a digital product
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { productId, couponCode, customerEmail, customPrice } = body;

        if (!productId || !customerEmail) {
            return NextResponse.json(errorResponse('Product ID and Email are required'), { status: 400 });
        }

        // 1. Fetch Product
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return NextResponse.json(errorResponse('Product not found or inactive'), { status: 404 });
        }

        // 2. Determine Base Price
        let basePrice = product.pricing?.salePrice || product.pricing?.basePrice || product.price || 0;

        // Handle PWYW (Pay What You Want)
        if (product.pricingType === 'pwyw' && customPrice) {
            const minPrice = product.minPrice || 0;
            if (customPrice < minPrice) {
                return NextResponse.json(errorResponse(`Price must be at least ₹${minPrice}`), { status: 400 });
            }
            basePrice = customPrice;
        }

        // Handle Free
        if (product.pricingType === 'free') {
            basePrice = 0;
        }

        let finalAmount = basePrice;
        let appliedCoupon = null;

        // 3. Apply Coupon if provided
        if (couponCode && finalAmount > 0) {
            const couponResult = await validateCoupon(
                couponCode,
                finalAmount,
                [productId],
                product.creatorId.toString(),
                customerEmail
            );

            if (couponResult.valid) {
                finalAmount = Math.max(0, finalAmount - couponResult.discount);
                appliedCoupon = couponResult.coupon;
            }
        }

        // 4. Create Razorpay Order if price > 0
        let razorpayOrder = null;
        if (finalAmount > 0) {
            razorpayOrder = await createRazorpayOrder({
                amount: Math.round(finalAmount * 100), // to paise
                currency: product.pricing?.currency || 'INR',
                receipt: `rcpt_${Math.random().toString(36).substring(2, 10)}`,
                notes: {
                    productId: product._id.toString(),
                    customerEmail,
                    creatorId: product.creatorId.toString(),
                    couponCode: couponCode || ''
                }
            });
        }

        return NextResponse.json({
            success: true,
            orderId: razorpayOrder?.id, // null for free products
            amount: finalAmount,
            currency: product.pricing?.currency || 'INR',
            key: process.env.RAZORPAY_KEY_ID,
            product: {
                title: product.title,
                thumbnail: product.thumbnailKey
            },
            isFree: finalAmount === 0
        });

    } catch (error: any) {
        console.error('Create Digital Order Error:', error);
        return NextResponse.json(errorResponse('Failed to create order', error.message), { status: 500 });
    }
}
