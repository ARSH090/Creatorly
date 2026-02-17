import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { logAdminAction } from '@/lib/admin/logger';

/**
 * POST /api/admin/orders/:id/refund
 * Issue refund for an order
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const orderId = params.id;

    const body = await req.json();
    const { amount, reason } = body;

    const order = await Order.findById(orderId);
    if (!order) {
        return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
        );
    }

    if (order.paymentStatus !== 'paid') {
        return NextResponse.json(
            { success: false, error: 'Order is not paid' },
            { status: 400 }
        );
    }

    // Validate refund amount
    const refundAmount = amount || order.total;
    if (refundAmount > order.total) {
        return NextResponse.json(
            { success: false, error: 'Refund amount cannot exceed order total' },
            { status: 400 }
        );
    }

    // TODO: Process actual refund with Razorpay
    // For now, just update order status
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    try {
        // Process refund with Razorpay
        const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100), // Convert to paise
            notes: {
                reason: reason || 'Admin refund',
                admin: user.email
            }
        });

        // Update order
        order.paymentStatus = 'refunded';
        order.refundAmount = refundAmount;
        order.refundReason = reason;
        order.refundedAt = new Date();
        order.refundedBy = user.email;
        order.razorpayRefundId = refund.id;

        await order.save();

        // Log action
        await logAdminAction(
            user.email,
            'REFUND_ORDER',
            'order',
            orderId,
            { amount: refundAmount, reason },
            req
        );

        return NextResponse.json({
            success: true,
            data: { order, refund },
            message: 'Refund processed successfully'
        });
    } catch (error: any) {
        console.error('Refund error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process refund: ' + error.message },
            { status: 500 }
        );
    }
}

export const POST = withAdminAuth(handler);
