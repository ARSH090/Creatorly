import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { AdminLog } from '@/lib/models/AdminLog';
import { razorpay } from '@/lib/payments/razorpay';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function postHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const order = await Order.findById(id);
    if (!order) return new NextResponse('Order not found', { status: 404 });

    if ((order.status as any) !== 'completed') {
        return new NextResponse('Order is not eligible for refund', { status: 400 });
    }

    const paymentId = order.razorpayPaymentId;
    if (!paymentId) {
        return new NextResponse('Payment ID missing', { status: 400 });
    }

    // Process Refund with Razorpay
    try {
        await razorpay.payments.refund(paymentId, {
            notes: {
                reason: 'Admin initiated refund',
                admin: user.email
            }
        });
    } catch (rpError: any) {
        console.error('Razorpay Refund Error:', rpError);
        return new NextResponse(`Razorpay Error: ${rpError.error?.description || rpError.message}`, { status: 502 });
    }

    // Update Order Status
    order.status = 'refunded';
    order.refundedAt = new Date();
    await order.save();

    // Log Admin Action
    await AdminLog.create({
        adminEmail: user.email,
        action: 'refund_order',
        targetType: 'order',
        targetId: order._id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ message: 'Order refunded successfully' });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
