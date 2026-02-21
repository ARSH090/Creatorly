import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { ProcessedWebhook } from '@/lib/models/ProcessedWebhook';
import { Affiliate } from '@/lib/models/Affiliate';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import Subscription from '@/lib/models/Subscription';
import User from '@/lib/models/User'; // For tier management
import { generateDownloadToken } from '@/lib/services/downloadToken';
import mongoose from 'mongoose';
import { log } from '@/utils/logger';

/**
 * Helper to process a successful order (One-time or Subscription Renewal)
 */
async function processSuccessfulOrder(order: any) {
    if (order.status === 'processing_complete') return; // Idempotency check 

    // 1. Generate download tokens for digital products
    for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (product && ['digital', 'course', 'digital_download'].includes((product as any).type || product.productType)) {
            await generateDownloadToken(
                order._id.toString(),
                item.productId.toString(),
                product.maxDownloads || 3,
                product.downloadExpiryDays || 30
            );
        }
    }

    // 2. Calculate affiliate commission
    if (order.affiliateId) {
        const affiliate = await Affiliate.findOne({
            creatorId: order.creatorId,
            _id: order.affiliateId,
            status: 'active'
        });

        if (affiliate) {
            const commission = (order.total * affiliate.commissionRate) / 100;

            order.commissionAmount = commission;
            await order.save();

            // Update affiliate stats
            await Affiliate.updateOne(
                { _id: affiliate._id },
                {
                    $inc: {
                        totalSales: 1,
                        totalCommission: commission
                    }
                }
            );

            log.info(`Affiliate commission: ₹${commission} for affiliate ${affiliate.affiliateCode}`, { orderId: order._id, affiliateId: affiliate._id });
        }
    }

    // 3. Track purchase analytics event
    for (const item of order.items) {
        await (AnalyticsEvent as any).create({
            creatorId: order.creatorId,
            productId: item.productId,
            eventType: 'purchase',
            source: (order as any).metadata?.source || 'direct',
            campaign: (order as any).metadata?.campaign,
            metadata: {
                orderId: order._id,
                amount: item.price * (item.quantity || 1),
                isSubscription: !!order.subscriptionId
            },
            timestamp: new Date(),
            day: new Date().toISOString().split('T')[0],
            hour: new Date().toISOString().slice(0, 13)
        });
    }

    // 4. Send emails
    try {
        const { sendPaymentConfirmationEmail, sendDownloadInstructionsEmail, sendAffiliateNotificationEmail } = await import('@/lib/services/email');

        await sendPaymentConfirmationEmail(
            order.customerEmail,
            order._id.toString(),
            order.total,
            order.items
        );

        // Send download instructions if applicable
        const digitalItems = order.items.filter((i: any) => ['digital', 'course'].includes(i.type));
        if (digitalItems.length > 0) {
            await sendDownloadInstructionsEmail(
                order.customerEmail,
                order._id.toString(),
                digitalItems.map((i: any) => ({ name: i.name, productId: i.productId.toString() }))
            );
        }

        // Send affiliate notification if applicable
        if (order.affiliateId && order.commissionAmount && order.commissionAmount > 0) {
            const { User } = await import('@/lib/models/User');
            const { Affiliate } = await import('@/lib/models/Affiliate');
            const affiliateDoc = await Affiliate.findOne({ _id: order.affiliateId });

            if (affiliateDoc) {
                const affiliateUser = await User.findById(affiliateDoc.affiliateId);
                if (affiliateUser && affiliateUser.email) {
                    await sendAffiliateNotificationEmail(
                        affiliateUser.email,
                        affiliateDoc.affiliateCode,
                        order.commissionAmount,
                        order._id.toString()
                    );
                }
            }
        }

    } catch (emailError: any) {
        log.error('Failed to send emails for order:', { orderId: order._id, error: emailError.message });
    }
}

/**
 * POST /api/payments/razorpay/webhook
 * Enhanced webhook handler with:
 * - Idempotency (prevent duplicate processing)
 * - Discount code application
 * - Affiliate commission calculation
 * - Download token generation
 * - Analytics event tracking
 * - Email notifications
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        // 1. Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            log.error('Invalid webhook signature received', { signature, expectedSignature });
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        const { event: eventType, payload } = event;

        await connectToDatabase();

        // 2. Check idempotency - prevent duplicate processing
        const webhookId = event.id || payload.payment?.entity?.id;
        const existing = await ProcessedWebhook.findOne({ webhookId });

        if (existing) {
            log.info(`Webhook ${webhookId} already processed`, { eventType });
            return NextResponse.json({ status: 'already_processed' });
        }

        // 3. Mark as processed immediately
        await ProcessedWebhook.create({
            webhookId,
            event: eventType,
            payload: event,
            processedAt: new Date()
        });

        // 4. Handle payment success
        if (eventType === 'payment.captured') {
            const razorpayOrderId = payload.payment.entity.order_id;
            const razorpayPaymentId = payload.payment.entity.id;

            const order = await Order.findOne({ razorpayOrderId });

            if (!order) {
                log.error(`Order not found for Razorpay order: ${razorpayOrderId}`, { razorpayPaymentId });
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // Update order status
            order.razorpayPaymentId = razorpayPaymentId;
            order.paymentStatus = 'paid';
            order.status = 'completed';
            order.paidAt = new Date();
            await order.save();

            // TIER: Increment monotonic counter if creator is on FREE tier
            try {
                const creator = await User.findById(order.creatorId).select('subscriptionTier');
                if (creator && creator.subscriptionTier === 'free') {
                    await User.findByIdAndUpdate(order.creatorId, {
                        $inc: { freeTierOrdersCount: 1 }
                    });
                    log.info(`Incremented freeTierOrdersCount for creator ${order.creatorId}`);
                }
            } catch (counterErr) {
                log.error('Failed to increment order counter', { error: counterErr });
            }

            // Increment coupon usedCount NOW (after payment success, not at order creation)
            if (order.couponId) {
                try {
                    const { default: Coupon } = await import('@/lib/models/Coupon');
                    await Coupon.findByIdAndUpdate(order.couponId, { $inc: { usedCount: 1 } });
                    log.info(`Coupon ${order.couponId} usage incremented for order ${order._id}`);
                } catch (couponErr) {
                    log.error('Failed to increment coupon usage', { error: couponErr });
                }
            }

            // 5. Fulfillment logic
            try {
                // Generate download tokens
                for (const item of order.items) {
                    const product = await Product.findById(item.productId);
                    if (product && ['digital', 'course', 'digital_download'].includes((product as any).type || product.productType)) {
                        await generateDownloadToken(
                            order._id.toString(),
                            item.productId.toString(),
                            product.maxDownloads || 3,
                            product.downloadExpiryDays || 30
                        );
                    }
                }

                // Affiliate commission
                if (order.affiliateId) {
                    const affiliate = await Affiliate.findOne({
                        creatorId: order.creatorId,
                        _id: order.affiliateId,
                        status: 'active'
                    });

                    if (affiliate) {
                        const commission = (order.total * affiliate.commissionRate) / 100;
                        order.commissionAmount = commission;
                        await order.save();

                        await Affiliate.updateOne(
                            { _id: affiliate._id },
                            { $inc: { totalSales: 1, totalCommission: commission } }
                        );
                        log.info(`Commission ₹${commission} recorded for affiliate ${affiliate.affiliateCode}`);
                    }
                }

                // Analytics
                for (const item of order.items) {
                    await (AnalyticsEvent as any).create({
                        creatorId: order.creatorId,
                        productId: item.productId,
                        eventType: 'purchase',
                        source: (order as any).metadata?.source || 'direct',
                        campaign: (order as any).metadata?.campaign,
                        metadata: { orderId: order._id, amount: item.price * (item.quantity || 1) },
                        timestamp: new Date(),
                        day: new Date().toISOString().split('T')[0],
                        hour: new Date().toISOString().slice(0, 13)
                    });
                }

                // Emails
                const { sendPaymentConfirmationEmail, sendDownloadInstructionsEmail, sendAffiliateNotificationEmail } = await import('@/lib/services/email');
                await sendPaymentConfirmationEmail(order.customerEmail, order._id.toString(), order.total, order.items);

                // Trigger Purchase Sequence & Cancel Abandoned Cart
                try {
                    const { enrollInSequence } = await import('@/lib/services/marketing');
                    const { default: SequenceEnrollment } = await import('@/lib/models/SequenceEnrollment');

                    // 1. Cancel abandoned cart sequence for this user/creator
                    await SequenceEnrollment.updateMany(
                        { email: order.customerEmail, creatorId: order.creatorId, status: 'active' },
                        { status: 'cancelled' }
                    );

                    // 2. Enroll in purchase sequence
                    await enrollInSequence(order.customerEmail, order.creatorId.toString(), 'purchase');
                } catch (seqErr: any) {
                    log.error('Failed to handle sequence enrollment in webhook', { error: seqErr.message });
                }

                const digitalItems = order.items.filter(i => ['digital', 'course'].includes(i.type));
                if (digitalItems.length > 0) {
                    await sendDownloadInstructionsEmail(
                        order.customerEmail,
                        order._id.toString(),
                        digitalItems.map((i: any) => ({ name: i.name, productId: i.productId.toString() }))
                    );
                }

                if (order.affiliateId && order.commissionAmount && order.commissionAmount > 0) {
                    const { User } = await import('@/lib/models/User');
                    const affiliateDoc = await Affiliate.findById(order.affiliateId);
                    if (affiliateDoc) {
                        const affiliateUser = await User.findById(affiliateDoc.affiliateId);
                        if (affiliateUser?.email) {
                            await sendAffiliateNotificationEmail(affiliateUser.email, affiliateDoc.affiliateCode, order.commissionAmount, order._id.toString());
                        }
                    }
                }

                // 6. Handle Booking Confirmation
                if (order.metadata?.bookingId) {
                    const { Booking } = await import('@/lib/models/Booking');
                    const booking = await Booking.findById(order.metadata.bookingId);
                    if (booking) {
                        booking.status = 'confirmed';
                        await booking.save();
                        log.info(`Booking ${booking._id} confirmed for order ${order._id}`);

                        // Send booking-specific email
                        try {
                            const { sendBookingConfirmationEmail } = await import('@/lib/services/email');
                            const { format } = await import('date-fns');
                            await sendBookingConfirmationEmail(order.customerEmail, {
                                productName: order.items[0]?.name || 'Coaching Session',
                                date: format(new Date(booking.startTime), 'EEEE, MMMM do, yyyy'),
                                time: format(new Date(booking.startTime), 'hh:mm a'),
                                duration: Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 60000)
                            });
                        } catch (emailErr: any) {
                            log.error(`Failed to send booking confirmation email for booking ${booking._id}`, { error: emailErr.message });
                        }
                    }
                }

                // 7. Auto-create Project if applicable
                try {
                    const { ProjectService } = await import('@/lib/services/projectService');
                    const project = await ProjectService.createProjectFromOrder(order._id.toString());
                    if (project) {
                        log.info(`Project ${project._id} auto-created for order ${order._id}`);
                    }
                } catch (projErr: any) {
                    log.error(`Failed to auto-create project for order ${order._id}`, { error: projErr.message });
                }

                // 8. Auto-generate Invoice
                try {
                    const { BillingService } = await import('@/lib/services/billingService');
                    const invoice = await BillingService.generateInvoiceFromOrder(order._id.toString());
                    if (invoice) {
                        log.info(`Invoice ${invoice.invoiceNumber} generated for order ${order._id}`);
                    }
                } catch (billingErr: any) {
                    log.error(`Failed to generate invoice for order ${order._id}`, { error: billingErr.message });
                }
            } catch (err: any) {
                log.error(`Order ${order._id} fulfillment encountered issues`, { error: err.message });
                // Don't fail the whole webhook if fulfillment logic has partial failure
            }

            log.info(`Order ${order._id} completed successfully via webhook`, { razorpayOrderId, razorpayPaymentId });
            return NextResponse.json({ status: 'success', orderId: order._id });
        }

        // 8.5 Handle payment failure
        if (eventType === 'payment.failed') {
            const razorpayOrderId = payload.payment.entity.order_id;
            const order = await Order.findOne({ razorpayOrderId });
            if (order) {
                order.paymentStatus = 'failed';
                await order.save();
                log.warn(`Order ${order._id} payment failed`, { razorpayOrderId });
            } else {
                log.error(`Order not found for failed payment: ${razorpayOrderId}`);
            }
            return NextResponse.json({ status: 'failure_logged' });
        }

        // 9. Subscription Authenticated (Active) - TIER UPGRADE
        if (eventType === 'subscription.authenticated') {
            const subId = payload.subscription.entity.id;
            const sub = await Subscription.findOne({ razorpaySubscriptionId: subId });

            if (sub) {
                sub.status = 'active';
                sub.startDate = new Date();
                await sub.save();

                // TIER UPGRADE LOGIC (Platform Plans Only)
                // Distinct from Creator Membership Products (which have a productId)
                if (sub.planId) {
                    const { Plan } = await import('@/lib/models/Plan');
                    const platformPlan = await Plan.findById(sub.planId);

                    if (platformPlan) {
                        const tier = platformPlan.tier || (platformPlan.name.toLowerCase().includes('pro') ? 'pro' : 'creator');
                        await User.findByIdAndUpdate(sub.userId, {
                            subscriptionTier: tier,
                            subscriptionStatus: 'active',
                            subscriptionStartAt: new Date(),
                            subscriptionEndAt: sub.endDate,
                            plan: tier // Support for legacy plan field
                        });
                        log.info(`Subscription ${subId} authenticated - Platform TIER upgraded to ${tier}`);
                    }
                } else if (sub.productId) {
                    // This is a creator-level product membership
                    // No platform-tier upgrade, just mark subscription as active
                    log.info(`Membership Product authenticated for sub ${subId} - Product ID: ${sub.productId}`);

                    // Optional: Link to User model's activeSubscriptions if we start tracking multiple
                }
            } else {
                log.warn(`Subscription ${subId} not found for authentication`);
            }
            return NextResponse.json({ status: 'subscription_activated' });
        }

        // 10. Subscription Charged (Renewal or First Payment)
        if (eventType === 'subscription.charged') {
            const subId = payload.subscription.entity.id;
            const paymentId = payload.payment.entity.id;
            const amount = payload.payment.entity.amount / 100;

            const sub = await Subscription.findOne({ razorpaySubscriptionId: subId });

            if (sub) {
                sub.status = 'active';
                sub.lastPaymentId = paymentId;
                sub.renewalCount = (sub.renewalCount || 0) + 1;

                const currentEnd = sub.endDate > new Date() ? sub.endDate : new Date();
                const newEnd = new Date(currentEnd);
                if (sub.billingPeriod === 'monthly') newEnd.setMonth(newEnd.getMonth() + 1);
                else if (sub.billingPeriod === 'yearly') newEnd.setFullYear(newEnd.getFullYear() + 1);

                sub.endDate = newEnd;
                await sub.save();

                const product = await Product.findById(sub.productId);
                if (product) {
                    // Look up subscriber email from User model
                    const subscriber = await User.findById(sub.userId).select('email').lean() as any;
                    const subscriberEmail = subscriber?.email || 'unknown@subscriber.com';

                    await Order.create({
                        creatorId: product.creatorId, // Use the product's creator, not the subscriber
                        items: [{
                            productId: product._id,
                            name: product.name,
                            price: amount,
                            quantity: 1,
                            type: 'subscription'
                        }],
                        userId: sub.userId,
                        customerEmail: subscriberEmail,
                        amount: amount,
                        total: amount,
                        currency: 'INR',
                        razorpayOrderId: payload.payment.entity.order_id || 'sub_renewal',
                        razorpayPaymentId: paymentId,
                        paymentStatus: 'paid',
                        status: 'completed',
                        paidAt: new Date(),
                        subscriptionId: sub._id,
                        metadata: {
                            subscriptionId: subId,
                            renewalCount: sub.renewalCount
                        }
                    });
                    log.info(`Order created for subscription renewal: ${subId}`, { paymentId });
                } else {
                    log.error(`Product ${sub.productId} not found for subscription renewal ${subId}`);
                }
            } else {
                log.error(`Subscription ${subId} not found for charge`);
            }
            return NextResponse.json({ status: 'subscription_charged' });
        }

        // Handle refund
        if (eventType === 'refund.created') {
            const razorpayPaymentId = payload.refund.entity.payment_id;
            const refundAmount = payload.refund.entity.amount / 100; // Convert paise to rupees

            const order = await Order.findOne({ razorpayPaymentId });

            if (order) {
                const totalAmount = order.total || order.amount;
                order.paymentStatus = refundAmount >= totalAmount ? 'refunded' : 'partially_refunded';
                order.refundAmount = (order.refundAmount || 0) + refundAmount;
                await order.save();

                // Deactivate download tokens
                try {
                    const { deactivateDownloadToken } = await import('@/lib/services/downloadToken');
                    await deactivateDownloadToken(order._id.toString());
                } catch (tErr: any) {
                    log.error(`Failed to deactivate token for refund: ${order._id}`);
                }

                // Track refund event
                await (AnalyticsEvent as any).create({
                    creatorId: order.creatorId,
                    eventType: 'refund',
                    metadata: { orderId: order._id, amount: refundAmount },
                    timestamp: new Date(),
                    day: new Date().toISOString().split('T')[0],
                    hour: new Date().toISOString().slice(0, 13)
                });
                log.info(`Refund processed for order ${order._id}`, { refundAmount });
            } else {
                log.warn(`Order not found for refund: ${razorpayPaymentId}`);
            }
        }

        // TIER: Handle subscription cancellation
        if (eventType === 'subscription.cancelled') {
            const subId = payload.subscription.entity.id;
            const sub = await Subscription.findOne({ razorpaySubscriptionId: subId });

            if (sub) {
                sub.status = 'canceled';
                sub.autoRenew = false;
                await sub.save();

                // If platform plan, update user record
                if (sub.planId) {
                    await User.findByIdAndUpdate(sub.userId, {
                        subscriptionStatus: 'cancelled'
                        // Tier remains active until endDate
                    });
                }

                log.info(`Subscription ${subId} cancelled - access remains until ${sub.endDate}`);
            }
            return NextResponse.json({ status: 'subscription_cancelled' });
        }

        // TIER: Handle subscription expiry - auto-downgrade to FREE
        if (eventType === 'subscription.expired' || eventType === 'subscription.completed') {
            const subId = payload.subscription.entity.id;
            const sub = await Subscription.findOne({ razorpaySubscriptionId: subId });

            if (sub) {
                sub.status = 'expired';
                await sub.save();

                // DOWNGRADE TO FREE (Platform Plans Only)
                if (sub.planId) {
                    await User.findByIdAndUpdate(sub.userId, {
                        subscriptionTier: 'free',
                        subscriptionStatus: 'expired'
                    });

                    // Deactivate products over FREE tier limit (keep first 1)
                    const products = await Product.find({
                        creatorId: sub.userId,
                        status: 'active' // Corrected from 'published'
                    }).sort({ createdAt: 1 });

                    if (products.length > 1) {
                        const toDeactivate = products.slice(1);
                        await Product.updateMany(
                            { _id: { $in: toDeactivate.map((p: any) => p._id) } },
                            { $set: { status: 'draft', isActive: false } }
                        );
                        log.info(`Deactivated ${toDeactivate.length} excess products for expired platform sub ${subId}`);
                    }
                    log.info(`Platform Subscription ${subId} expired - User downgraded to FREE`);
                } else if (sub.productId) {
                    // Creator Membership expired
                    // Product access logic usually checks if an active subscription exists, 
                    // so marking the sub as expired is sufficient.
                    log.info(`Creator Membership ${subId} expired for user ${sub.userId}`);
                }
            }
            return NextResponse.json({ status: 'subscription_expired_downgraded' });
        }

        return NextResponse.json({ status: 'processed' });
    } catch (error: any) {
        log.error('Webhook processing failure', { error: error.message });
        return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
    }
}
