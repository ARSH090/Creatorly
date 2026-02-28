import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { Payment } from '@/lib/models/Payment';
import { Invoice } from '@/lib/models/Invoice';
import { WebhookEventLog } from '@/lib/models/WebhookEventLog';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { Plan } from '@/lib/models/Plan';
import EmailSequence from '@/lib/models/EmailSequence';
import SequenceEnrollment from '@/lib/models/SequenceEnrollment';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { QueueJob } from '@/lib/models/QueueJob';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';
import { decryptTokenWithVersion } from '@/lib/security/encryption';
import { rateLimit } from '@/lib/utils/rate-limit';

/** Default free-tier limits used when plan cannot be fetched from DB */
const DEFAULT_FREE_LIMITS = {
    maxProducts: 1,
    maxStorageMb: 100,
    maxTeamMembers: 0,
    maxAiGenerations: 0,
    customDomain: false,
    canRemoveBranding: false
};

export async function POST(req: NextRequest) {
    try {
        // Rate Limiting
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const isAllowed = await rateLimit(ip, 'webhook', 100, 60); // 100 req per min
        if (!isAllowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            const ip = req.headers.get('x-forwarded-for') || 'unknown';
            console.warn(`[RAZORPAY WEBHOOK] Missing signature from ${ip} — dropping`);
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        await dbConnect();

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error('CRITICAL: Razorpay Webhook Secret not configured');
            // Still return 200 — this is a server config error, not Razorpay's fault
            return NextResponse.json({ status: 'config_error' }, { status: 200 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            const ip = req.headers.get('x-forwarded-for') || 'unknown';
            console.warn(`[RAZORPAY WEBHOOK] Invalid signature from ${ip} — dropping`);
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        const event = JSON.parse(body);
        const payload = event.payload;

        // BUG-10 FIX: Check idempotency FIRST — before any processing
        const existingEvent = await WebhookEventLog.findOne({ eventId: event.id });
        if (existingEvent) {
            return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        // BUG-10 FIX: Write idempotency log BEFORE processing to prevent double-processing on retry
        await WebhookEventLog.create({
            platform: 'razorpay',
            eventId: event.id,
            eventType: event.event,
            payloadHash: crypto.createHash('sha256').update(body).digest('hex'),
            payload: event,
            status: 'pending',
            processed: false,
            processedAt: undefined
        });

        console.log(`[RAZORPAY WEBHOOK] Processing: ${event.event}`);

        switch (event.event) {

            case 'subscription.activated': {
                const subData = payload.subscription.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });

                if (subscription) {
                    const plan = await Plan.findById(subscription.planId);
                    const isTrial = subData.start_at > Math.floor(Date.now() / 1000);

                    subscription.status = isTrial ? 'trialing' : 'active';
                    subscription.razorpayCustomerId = subData.customer_id;
                    subscription.startDate = new Date(subData.start_at * 1000);
                    subscription.endDate = new Date(subData.end_at * 1000);
                    if (isTrial) subscription.trialEndsAt = subscription.startDate;
                    await subscription.save();

                    const updateData: any = {
                        subscriptionStatus: subscription.status,
                        subscriptionEndAt: subscription.endDate
                    };
                    if (plan) {
                        updateData.subscriptionTier = plan.tier;
                        updateData.planLimits = plan.limits;
                    }

                    await User.findByIdAndUpdate(subscription.userId, updateData);
                    console.log(`[RAZORPAY WEBHOOK] Subscription ${subscription.status} for user ${subscription.userId}. Tier: ${plan?.tier || 'unknown'}`);
                }
                break;
            }

            case 'subscription.charged': {
                const subData = payload.subscription.entity;
                const paymentData = payload.payment.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });

                if (subscription) {
                    subscription.status = 'active';
                    subscription.endDate = new Date(subData.end_at * 1000);
                    subscription.lastPaymentId = paymentData.id;
                    subscription.renewalCount += 1;
                    await subscription.save();

                    // Record Payment
                    await Payment.create({
                        userId: subscription.userId,
                        subscriptionId: subscription._id,
                        razorpayPaymentId: paymentData.id,
                        amount: paymentData.amount,
                        status: 'captured',
                        currency: paymentData.currency
                    });

                    // BUG-15 FIX: Sequential invoice number
                    const invoiceCount = await Invoice.countDocuments({ userId: subscription.userId });
                    const user = await User.findById(subscription.userId).select('username subscriptionStatus planLimits');
                    const invoiceNumber = `INV-${(user?.username || 'USR').toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`;

                    await Invoice.create({
                        userId: subscription.userId,
                        subscriptionId: subscription._id,
                        invoiceNumber,
                        amount: paymentData.amount / 100,
                        issuedAt: new Date()
                    });

                    if (user) {
                        const updateData: any = {
                            subscriptionStatus: 'active',
                            subscriptionEndAt: subscription.endDate
                        };

                        if (user.subscriptionStatus === 'trialing' || !user.planLimits) {
                            const plan = await Plan.findById(subscription.planId);
                            if (plan) {
                                updateData.planLimits = plan.limits;
                                updateData.subscriptionTier = plan.tier;
                                updateData.trialUsed = true;
                                console.log(`[RAZORPAY WEBHOOK] Trial converted to paid for user ${user._id}. Tier: ${plan.tier}`);
                            }
                        }

                        await User.findByIdAndUpdate(subscription.userId, updateData);
                    }
                }
                break;
            }

            case 'payment.captured': {
                const payment = payload.payment.entity;
                const razorpayOrderId = payment.order_id;
                const order = await Order.findOne({ razorpayOrderId });

                if (order && order.status !== 'completed') {
                    order.status = 'completed';
                    order.paymentStatus = 'paid';
                    order.razorpayPaymentId = payment.id;
                    order.paidAt = new Date();
                    await order.save();

                    // Area 3: Post-Purchase Automation (DMs and Emails)
                    try {
                        const product = await Product.findById(order.items[0]?.productId);
                        if (product) {
                            // 1. Post-Purchase Instagram DM
                            if (product.postPurchaseDmEnabled && product.postPurchaseDmText && order.metadata?.ig_user_id) {
                                const socialAccount = await SocialAccount.findOne({ userId: order.creatorId, platform: 'instagram', isActive: true });
                                if (socialAccount) {
                                    const accessToken = decryptTokenWithVersion(socialAccount.pageAccessToken, socialAccount.tokenIV, socialAccount.tokenTag, socialAccount.keyVersion);
                                    await QueueJob.create({
                                        type: 'dm_delivery',
                                        payload: {
                                            recipientId: order.metadata.ig_user_id,
                                            text: product.postPurchaseDmText,
                                            accessToken,
                                            creatorId: order.creatorId.toString(),
                                            source: 'dm',
                                            platform: 'instagram'
                                        }
                                    });
                                    console.log(`[RAZORPAY WEBHOOK] Enqueued post-purchase DM for order ${order.orderNumber}`);
                                }
                            }

                            // 2. Post-Purchase Email (One-off via Queue)
                            if (product.postPurchaseEmailEnabled && product.postPurchaseEmailSubject && product.postPurchaseEmailContent) {
                                await QueueJob.create({
                                    type: 'one_off_email',
                                    payload: {
                                        email: order.customerEmail,
                                        subject: product.postPurchaseEmailSubject,
                                        content: product.postPurchaseEmailContent,
                                        creatorId: order.creatorId.toString(),
                                        source: 'purchase_delivery'
                                    },
                                    nextRunAt: new Date()
                                });
                                console.log(`[RAZORPAY WEBHOOK] Enqueued post-purchase email for order ${order.orderNumber}`);
                            }

                            // 3. Digital Fulfillment (Files, Courses, Licenses)
                            await DigitalDeliveryService.fulfillOrder(order._id.toString());
                            console.log(`[RAZORPAY WEBHOOK] Triggered fulfillment for order ${order.orderNumber}`);
                        }
                    } catch (automationErr) {
                        console.error('[RAZORPAY WEBHOOK] Post-purchase automation/fulfillment failed:', automationErr);
                    }
                }

                break;
            }

            case 'payment.failed': {
                const payment = payload.payment.entity;
                const razorpayOrderId = payment.order_id;
                const order = await Order.findOne({ razorpayOrderId });

                if (order && order.status !== 'failed') {
                    order.status = 'failed';
                    order.paymentStatus = 'failed';
                    order.razorpayPaymentId = payment.id;
                    await order.save();
                    console.log(`[RAZORPAY WEBHOOK] Order ${order.orderNumber} marked as FAILED`);
                }
                break;
            }

            case 'refund.created': {
                const refund = payload.refund.entity;
                const paymentId = refund.payment_id;
                const order = await Order.findOne({ razorpayPaymentId: paymentId });

                if (order && order.status !== 'refunded') {
                    order.status = 'refunded';
                    order.paymentStatus = 'refunded';
                    order.refundStatus = 'COMPLETED';
                    order.refundAmount = refund.amount;
                    order.refundedAt = new Date();
                    await order.save();
                    console.log(`[RAZORPAY WEBHOOK] Order ${order.orderNumber} marked as REFUNDED`);
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.expired': {
                const subData = payload.subscription.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });

                if (subscription) {
                    subscription.status = event.event === 'subscription.cancelled' ? 'canceled' : 'expired';
                    subscription.autoRenew = false;
                    await subscription.save();

                    // BUG-16 FIX: Downgrade planLimits on cancellation/expiry
                    const freePlan = await Plan.findOne({ tier: 'free' });
                    await User.findByIdAndUpdate(subscription.userId, {
                        subscriptionStatus: subscription.status,
                        subscriptionTier: 'free',
                        planLimits: freePlan?.limits ?? DEFAULT_FREE_LIMITS
                    });

                    console.log(`[RAZORPAY WEBHOOK] Subscription ${event.event} for user ${subscription.userId}. Downgraded to free.`);
                }
                break;
            }

            case 'subscription.paused':
            case 'subscription.pending':
            case 'subscription.halted': {
                const subData = payload.subscription.entity;
                const subscription = await Subscription.findOne({ razorpaySubscriptionId: subData.id });

                if (subscription) {
                    let statusUpdate: string = 'pending';
                    if (event.event === 'subscription.halted') statusUpdate = 'halted';
                    if (event.event === 'subscription.paused') statusUpdate = 'past_due';

                    subscription.status = statusUpdate as any;
                    if (event.event === 'subscription.pending') {
                        subscription.failureCount = (subscription.failureCount || 0) + 1;
                        subscription.lastFailureReason = payload.payment?.entity?.error_description || 'Payment failed';
                    }
                    await subscription.save();

                    // Dunning notification
                    if (event.event === 'subscription.pending') {
                        await QueueJob.create({
                            type: 'one_off_email',
                            payload: {
                                userId: subscription.userId.toString(),
                                subject: 'Action Required: Your payment failed',
                                content: `We were unable to process your subscription payment. Reason: ${subscription.lastFailureReason}. We will retry automatically.`,
                                source: 'dunning'
                            }
                        });
                    }

                    // BUG-11 FIX: Downgrade planLimits when halted or past_due
                    const freePlan = await Plan.findOne({ tier: 'free' });
                    await User.findByIdAndUpdate(subscription.userId, {
                        subscriptionStatus: statusUpdate,
                        subscriptionTier: (statusUpdate === 'halted' || statusUpdate === 'past_due') ? 'free' : undefined,
                        planLimits: (statusUpdate === 'halted' || statusUpdate === 'past_due') ? (freePlan?.limits ?? DEFAULT_FREE_LIMITS) : undefined
                    });

                    console.log(`[RAZORPAY WEBHOOK] Subscription ${event.event} for user ${subscription.userId}. Status: ${statusUpdate}`);
                }
                break;
            }
        }

        // BUG-10 FIX: Update idempotency log to 'processed' after successful execution
        await WebhookEventLog.findOneAndUpdate(
            { eventId: event.id },
            { status: 'processed', processed: true, processedAt: new Date() }
        );

        return NextResponse.json({ status: 'ok' }, { status: 200 });

    } catch (error: any) {
        console.error('CRITICAL Webhook Process Failure:', error);
        // BUG-09 FIX: ALWAYS return 200 — never 500 — to prevent Razorpay from retrying
        return NextResponse.json({ status: 'error_logged' }, { status: 200 });
    }
}
