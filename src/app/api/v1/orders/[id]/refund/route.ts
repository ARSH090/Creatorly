import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import { getMongoUser } from '@/lib/auth/get-user';
import { razorpay } from '@/lib/payments/razorpay';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const order = await Order.findOne({ _id: params.id, creatorId: user._id });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        if (order.status === 'refunded') {
            return NextResponse.json({ error: 'Order already refunded' }, { status: 400 });
        }

        if (order.paymentGateway === 'razorpay' && order.razorpayPaymentId) {
            try {
                // Initialize refund in Razorpay
                const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
                    amount: order.total, // Full refund
                    notes: { reason: 'Customer request via Dashboard' }
                });

                // Update Order status
                order.status = 'refunded';
                order.paymentStatus = 'refunded';
                order.refundStatus = 'COMPLETED';
                order.refundAmount = order.total;
                order.refundedAt = new Date();
                order.razorpayRefundId = refund.id;
                await order.save();

                return NextResponse.json({ success: true, refundId: refund.id });
            } catch (rpcError: any) {
                console.error('Razorpay Refund Error:', rpcError);
                return NextResponse.json({ error: rpcError.message || 'Refund failed' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Payment gateway not supported for automatic refund' }, { status: 400 });

    } catch (error: any) {
        console.error('Refund API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
