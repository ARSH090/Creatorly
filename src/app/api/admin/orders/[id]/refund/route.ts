import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { AdminLog } from '@/lib/models/AdminLog';
import { razorpay } from '@/lib/payments/razorpay';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const order = await Order.findById(id);
        if (!order) return new NextResponse('Order not found', { status: 404 });

        if (order.status !== 'paid') {
            return new NextResponse('Order is not eligible for refund', { status: 400 });
        }

        const paymentId = order.paymentDetails?.razorpayPaymentId;
        if (!paymentId) {
            return new NextResponse('Payment ID missing', { status: 400 });
        }

        // Process Refund with Razorpay
        try {
            await razorpay.payments.refund(paymentId, {
                notes: {
                    reason: 'Admin initiated refund',
                    admin: session.user.email
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
            adminEmail: session.user.email,
            action: 'refund_order',
            targetType: 'order',
            targetId: order._id,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ message: 'Order refunded successfully' });

    } catch (error) {
        console.error('Refund API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
