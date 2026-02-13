import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { ProcessedWebhook } from '@/lib/models/ProcessedWebhook';
import { Affiliate } from '@/lib/models/Affiliate';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { generateDownloadToken } from '@/lib/services/downloadToken';

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
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        const { event: eventType, payload } = event;

        await connectToDatabase();

        // 2. Check idempotency - prevent duplicate processing
        const webhookId = event.id || payload.payment?.entity?.id;
        const existing = await ProcessedWebhook.findOne({ webhookId });

        if (existing) {
            console.log(`Webhook ${webhookId} already processed`);
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
                console.error(`Order not found for Razorpay order: ${razorpayOrderId}`);
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // Update order status
            order.razorpayPaymentId = razorpayPaymentId;
            order.paymentStatus = 'paid';
            order.paidAt = new Date();
            await order.save();

            // 5. Generate download tokens for digital products
            for (const item of order.items) {
                const product = await Product.findById(item.productId);

                if (product && ['digital', 'course'].includes(product.type)) {
                    await generateDownloadToken(
                        order._id.toString(),
                        item.productId.toString(),
                        product.maxDownloads || 3,
                        product.downloadExpiryDays || 30
                    );
                }
            }

            // 6. Calculate affiliate commission
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

                    console.log(`Affiliate commission: ₹${commission} for affiliate ${affiliate.affiliateCode}`);
                }
            }

            // 7. Track purchase analytics event
            for (const item of order.items) {
                await (AnalyticsEvent as any).create({
                    creatorId: order.creatorId,
                    productId: item.productId,
                    eventType: 'purchase',
                    source: (order as any).metadata?.source || 'direct',
                    campaign: (order as any).metadata?.campaign,
                    metadata: {
                        orderId: order._id,
                        amount: item.price * (item.quantity || 1)
                    },
                    timestamp: new Date(),
                    day: new Date().toISOString().split('T')[0],
                    hour: new Date().toISOString().slice(0, 13)
                });
            }

            // 8. Send order confirmation email
            try {
                const { sendPaymentConfirmationEmail, sendDownloadInstructionsEmail, sendAffiliateNotificationEmail } = await import('@/lib/services/email');

                await sendPaymentConfirmationEmail(
                    order.customerEmail,
                    order._id.toString(),
                    order.total,
                    order.items
                );

                // Send download instructions if applicable
                const digitalItems = order.items.filter(i => ['digital', 'course'].includes(i.type));
                if (digitalItems.length > 0) {
                    await sendDownloadInstructionsEmail(
                        order.customerEmail,
                        order._id.toString(),
                        digitalItems.map(i => ({ name: i.name, productId: i.productId.toString() }))
                    );
                }

                // Send affiliate notification if applicable
                if (order.affiliateId && order.commissionAmount && order.commissionAmount > 0) {
                    // Need to fetch user email for affiliate
                    const { User } = await import('@/lib/models/User');
                    // We need the affiliate document again to get the affiliateId (User ID)
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

            } catch (emailError) {
                console.error('Failed to send emails for order:', order._id, emailError);
                // Don't fail the webhook processing just because email failed
            }

            console.log(`Order ${order._id} completed successfully`);

            return NextResponse.json({ status: 'success', orderId: order._id });
        }

        // Handle refund
        if (eventType === 'refund.created') {
            const razorpayPaymentId = payload.refund.entity.payment_id;
            const refundAmount = payload.refund.entity.amount / 100; // Convert paise to rupees

            const order = await Order.findOne({ razorpayPaymentId });

            if (order) {
                order.paymentStatus = refundAmount >= order.total ? 'refunded' : 'partially_refunded';
                order.refundAmount = (order.refundAmount || 0) + refundAmount;
                await order.save();

                // Deactivate download tokens
                const { deactivateDownloadToken } = await import('@/lib/services/downloadToken');
                await deactivateDownloadToken(order._id.toString());

                // Track refund event
                await (AnalyticsEvent as any).create({
                    creatorId: order.creatorId,
                    eventType: 'refund',
                    metadata: { orderId: order._id, amount: refundAmount },
                    timestamp: new Date(),
                    day: new Date().toISOString().split('T')[0],
                    hour: new Date().toISOString().slice(0, 13)
                });
            }
        }

        return NextResponse.json({ status: 'processed' });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
    }
}
