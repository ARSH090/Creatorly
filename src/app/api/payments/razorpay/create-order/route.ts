import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { razorpay } from '@/lib/payments/razorpay';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { getCurrentUser } from '@/lib/auth/server-auth';
import Coupon from '@/lib/models/Coupon';

import { Affiliate } from '@/lib/models/Affiliate';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { cart, customer, couponCode } = await req.json();

        // ... existing cart validation ...

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // 1. Calculate Total & Validate Items
        const user = await getCurrentUser();
        let totalAmount = 0;
        const items = [];
        let creatorId = null;
        let bookingId: string | undefined;
        let subscriptionData: { planId: string; productId: string } | undefined;
        let downloadLimit = 3; // Default

        for (const cartItem of cart) {
            const product = await Product.findOne({ _id: cartItem.id, status: 'published' });
            if (!product) {
                return NextResponse.json({ error: `Product ${cartItem.id} is not available for purchase` }, { status: 400 });
            }

            // Only support single creator checkout for now
            if (!creatorId) creatorId = product.creatorId;

            // INVENTORY CHECK
            // Check variant stock if applicable
            if (cartItem.variantId && product.hasVariants) {
                const variant = product.variants?.find((v: any) => v.id === cartItem.variantId);
                if (!variant) {
                    return NextResponse.json({ error: `Variant not found for ${product.name}` }, { status: 400 });
                }
                if (!variant.isActive) {
                    return NextResponse.json({ error: `Variant ${variant.title} is unavailable` }, { status: 400 });
                }
                if (variant.stock !== null && variant.stock !== undefined && variant.stock < cartItem.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${product.name} (${variant.title})` }, { status: 400 });
                }
                // Override price with variant price
                cartItem.price = variant.price;
            }
            // Check main product stock (for physical items without variants or just base stock)
            else if (product.type === 'physical' && product.stock !== null && product.stock !== undefined) {
                if (product.stock < cartItem.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
                }
            }


            // Handle Membership / Subscription Logic
            if (product.type === 'membership' || product.paymentType === 'subscription') {
                if (!product.razorpayPlanId) {
                    return NextResponse.json({ error: `Product ${product.name} is missing a subscription plan configuration` }, { status: 400 });
                }
                subscriptionData = {
                    planId: product.razorpayPlanId,
                    productId: product._id.toString()
                };
            }

            // Extract minimum download limit for digital items
            if (product.type === 'digital' || product.type === 'course') {
                if (product.maxDownloads !== undefined) {
                    downloadLimit = Math.min(downloadLimit, product.maxDownloads);
                }
            }

            // Handle Coaching / Booking Logic
            if (product.type === 'coaching' && cartItem.metadata?.bookingDate) {
                const { Booking } = await import('@/lib/models/Booking');
                const startTime = new Date(`${cartItem.metadata.bookingDate.split('T')[0]}T${cartItem.metadata.bookingTime}`);
                const endTime = new Date(startTime.getTime() + (product.coachingDuration || 30) * 60000);

                const booking = await Booking.create({
                    creatorId: product.creatorId,
                    customerId: user ? (user as any)._id : new mongoose.Types.ObjectId(),
                    productId: product._id,
                    startTime,
                    endTime,
                    status: 'pending',
                    customerEmail: customer.email,
                    customerName: customer.name,
                    notes: `Booking for ${product.name}`
                });
                bookingId = booking._id.toString();
            }

            // Use the verified price (variant or base)
            const itemPrice = cartItem.price || product.price || 0;

            totalAmount += itemPrice * cartItem.quantity;
            items.push({
                productId: product._id,
                name: product.name,
                price: itemPrice,
                quantity: cartItem.quantity,
                type: product.type,
                variantId: cartItem.variantId, // Pass variantId to Order
                variantTitle: cartItem.variantTitle
            });
        }


        // Affiliate Logic
        const affiliateRef = req.cookies.get('affiliate_ref')?.value;
        let affiliateId = null;

        if (affiliateRef && creatorId) {
            const affiliate = await Affiliate.findOne({
                affiliateCode: affiliateRef,
                creatorId: creatorId,
                status: 'active'
            });

            if (affiliate) {
                affiliateId = affiliate._id;
            }
        }

        // Coupon Validation and Discount Application
        let discountAmount = 0;
        let couponId = null;
        let appliedCouponCode = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                status: 'active'
            });

            if (coupon) {
                // Check expiry
                const now = new Date();
                const isValid =
                    (!coupon.validFrom || now >= new Date(coupon.validFrom)) &&
                    (!coupon.validUntil || now <= new Date(coupon.validUntil));

                // Check usage limits
                const hasUsageLeft =
                    !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;

                if (isValid && hasUsageLeft) {
                    // Calculate discount
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (totalAmount * coupon.discountValue) / 100;
                        if (coupon.maxDiscountAmount) {
                            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                        }
                    } else if (coupon.discountType === 'fixed') {
                        discountAmount = coupon.discountValue;
                    }

                    // Ensure discount doesn't exceed total
                    discountAmount = Math.min(discountAmount, totalAmount);
                    couponId = coupon._id;
                    appliedCouponCode = coupon.code;

                    // Increment usage count
                    coupon.usedCount = (coupon.usedCount || 0) + 1;
                    await coupon.save();
                }
            }
        }

        // Apply discount before tax
        const discountedAmount = totalAmount - discountAmount;

        // Add 18% GST (Tax)
        const amountWithTax = discountedAmount * 1.18;
        const amountInPaise = Math.round(amountWithTax * 100);

        // 2. Create Razorpay Order or Subscription
        let razorpayOrder: any;
        let razorpaySubscriptionId: string | undefined;

        if (subscriptionData) {
            // 2a. Create Razorpay Subscription
            const sub = await razorpay.subscriptions.create({
                plan_id: subscriptionData.planId,
                total_count: 120, // 10 years for monthly
                quantity: 1,
                customer_notify: 1,
                notes: {
                    customerName: customer.name,
                    customerEmail: customer.email,
                    productId: subscriptionData.productId,
                    userId: (user as any)?._id?.toString() || 'guest'
                }
            });
            razorpaySubscriptionId = sub.id;
            razorpayOrder = { id: sub.id };
        } else {
            // 2b. Create Standard Razorpay Order
            razorpayOrder = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
                notes: {
                    customerName: customer.name,
                    customerEmail: customer.email,
                    itemsCount: items.length,
                    userId: (user as any)?._id?.toString() || 'guest',
                    productIds: items.map(i => i.productId.toString()).join(','),
                    affiliateId: affiliateId ? affiliateId.toString() : ''
                }
            }) as any;
        }

        // For memberships, create a pending subscription record
        let dbSubscriptionId: string | undefined;
        if (subscriptionData) {
            const { Subscription } = await import('@/lib/models/Subscription');
            const newSub = await Subscription.create({
                userId: user ? (user as any)._id : new mongoose.Types.ObjectId(),
                productId: subscriptionData.productId,
                originalPrice: totalAmount,
                discountAmount: discountAmount,
                finalPrice: discountedAmount,
                billingPeriod: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Placeholder
                status: 'pending',
                razorpaySubscriptionId: razorpaySubscriptionId
            });
            dbSubscriptionId = newSub._id.toString();
        }

        await Order.create({
            items,
            creatorId: creatorId as mongoose.Types.ObjectId,
            userId: user ? (user as any)._id : new mongoose.Types.ObjectId(),
            customerEmail: customer.email,
            amount: amountWithTax,
            total: amountWithTax,
            currency: 'INR',
            razorpayOrderId: razorpayOrder.id,
            status: 'pending',
            downloadLimit,
            subscriptionId: dbSubscriptionId,
            affiliateId: affiliateId ? affiliateId.toString() : undefined,
            couponId: couponId ? couponId.toString() : undefined,
            discountAmount: discountAmount,
            metadata: {
                customerName: customer.name,
                customerPhone: customer.phone,
                affiliateRef,
                couponCode: appliedCouponCode,
                originalAmount: totalAmount,
                discountApplied: discountAmount,
                bookingId,
                subscriptionId: razorpaySubscriptionId
            }
        });

        // Detect Upsell Opportunity
        let upsellOffer = null;
        for (const cartItem of cart) {
            const product = await Product.findOne({ _id: cartItem.id });
            if (product && product.hasUpsell && product.upsellProductId) {
                const upsellProduct = await Product.findOne({ _id: product.upsellProductId, status: 'published' });
                if (upsellProduct) {
                    upsellOffer = {
                        id: upsellProduct._id,
                        name: upsellProduct.name,
                        image: upsellProduct.image,
                        originalPrice: upsellProduct.price || 0,
                        offerPrice: Math.round((upsellProduct.price || 0) * 0.7), // 30% OFF
                        description: upsellProduct.description,
                    };
                    break; // Only one upsell per order for now
                }
            }
        }

        return NextResponse.json({
            id: razorpayOrder.id,
            isSubscription: !!subscriptionData,
            amount: amountInPaise,
            currency: 'INR',
            upsell: upsellOffer
        });

    } catch (error: any) {
        console.error('Razorpay Order Creation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
