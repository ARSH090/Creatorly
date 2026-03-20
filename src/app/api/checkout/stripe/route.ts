import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';
import { Coupon } from '@/lib/models/Coupon';
import { nanoid } from 'nanoid';
import { errorResponse } from '@/types/api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' as any });

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { productId, buyerEmail, buyerName, couponCode, successUrl, cancelUrl } = await req.json();

        if (!productId || !buyerEmail) {
            return NextResponse.json(errorResponse('productId and buyerEmail are required'), { status: 400 });
        }

        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return NextResponse.json(errorResponse('Product not found or unavailable'), { status: 404 });
        }

        const basePrice = product.pricing?.basePrice || product.price || 0;
        let finalPrice = basePrice;
        let couponId = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                creatorId: product.creatorId,
                code: couponCode.toUpperCase(),
                isActive: true,
                status: 'active',
            });
            if (coupon && (!coupon.validUntil || coupon.validUntil > new Date())) {
                const discount = coupon.discountType === 'percentage'
                    ? Math.floor(basePrice * (coupon.discountValue / 100))
                    : Math.min(coupon.discountValue * 100, basePrice);
                finalPrice = Math.max(0, basePrice - discount);
                couponId = coupon._id;
            }
        }

        const currency = (product.pricing?.currency || 'INR').toLowerCase();
        const orderNumber = `CR-STR-${nanoid(8).toUpperCase()}`;

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency,
                    product_data: {
                        name: product.title || product.name,
                        description: product.description?.substring(0, 200),
                        images: product.thumbnail ? [product.thumbnail] : [],
                    },
                    unit_amount: finalPrice, // already in paise/cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            customer_email: buyerEmail,
            success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_number=${orderNumber}`,
            cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/u/${product.creatorId}/${product.slug}`,
            metadata: {
                productId: productId.toString(),
                creatorId: product.creatorId.toString(),
                buyerEmail,
                buyerName: buyerName || '',
                orderNumber,
                couponId: couponId?.toString() || '',
                platform: 'creatorly',
            },
        });

        // Create pending order
        await Order.create({
            orderNumber,
            items: [{ productId: product._id, name: product.title, price: finalPrice, quantity: 1, type: product.productType }],
            creatorId: product.creatorId,
            customerEmail: buyerEmail.toLowerCase(),
            customerName: buyerName,
            amount: finalPrice,
            total: finalPrice,
            currency: currency.toUpperCase(),
            stripeSessionId: session.id,
            status: 'pending',
            paymentStatus: 'pending',
            couponId,
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error('Stripe checkout error:', err);
        return NextResponse.json(errorResponse('Failed to create checkout session'), { status: 500 });
    }
}
