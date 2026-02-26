import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OrderModel from '@/lib/models/Order';
import { razorpay } from '@/lib/payments/razorpay';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { recordSecurityEvent, SecurityEventType } from '@/lib/security/monitoring';

async function refundHandler(req: NextRequest, adminUser: any) {
    await connectToDatabase();
    const { orderId, amount, reason } = await req.json();

    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Fetch Order
    const order = await OrderModel.findById(orderId);
    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if ((order.status as any) !== 'completed') {
        return NextResponse.json({ error: 'Only successful orders can be refunded' }, { status: 400 });
    }

    if (!order.razorpayPaymentId) {
        return NextResponse.json({ error: 'Order has no associated payment ID' }, { status: 400 });
    }

    // Initiate Razorpay Refund
    const refundAmount = amount ? amount * 100 : order.amount * 100; // Convert to paise
    const refundResponse = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: refundAmount,
        speed: 'normal',
        notes: {
            reason: reason || 'Admin initiated refund',
            performedBy: adminUser.displayName
        }
    });

    // Update Order Status
    const updateData: any = {
        status: refundAmount >= order.amount * 100 ? 'refunded' : order.status,
        refundStatus: 'COMPLETED',
        refund: {
            amount: refundAmount / 100,
            reason: reason || 'Customer request',
            processedAt: new Date(),
            status: 'completed',
            refundId: refundResponse.id
        }
    };

    await OrderModel.findByIdAndUpdate(orderId, { $set: updateData });

    // Audit Logging
    await recordSecurityEvent(
        SecurityEventType.REFUND_INITIATED,
        {
            orderId,
            paymentId: order.razorpayPaymentId,
            refundId: refundResponse.id,
            amount: refundAmount / 100,
            performedBy: adminUser.displayName
        },
        req.headers.get('x-forwarded-for') || 'unknown',
        (adminUser as any)._id
    );

    return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
        refundId: refundResponse.id
    });
}

export const POST = withAdminAuth(async (req: NextRequest, adminUser: any) => {
    try {
        return await refundHandler(req, adminUser);
    } catch (error: any) {
        console.error('Refund Error:', error);
        return NextResponse.json({
            error: error.description || 'Failed to process refund. Check Razorpay logs.'
        }, { status: 500 });
    }
});
