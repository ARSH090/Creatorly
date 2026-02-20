
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Transaction from '@/lib/models/Transaction';
import { getMongoUser } from '@/lib/auth/get-user';
import { verifyRazorpaySignature } from '@/lib/payments/razorpay';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/orders/[id]/verify
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isValidId(id)) {
            return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
        }

        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment verification details' }, { status: 400 });
        }

        // 1. Verify Signature
        const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // 2. Fetch Order
        const order = await Order.findById(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Check if already paid
        if (order.status === 'completed' || order.paymentStatus === 'paid') {
            return NextResponse.json({ message: 'Order already processed', order });
        }

        // 3. Update Order
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        order.status = 'completed'; // or 'processing' if physical goods
        order.paymentStatus = 'paid';
        order.paidAt = new Date();

        await order.save();

        // 4. Create Transaction Record
        await Transaction.create({
            orderId: order._id,
            gateway: 'razorpay',
            gatewayTransactionId: razorpay_payment_id,
            amount: order.total,
            currency: order.currency,
            status: 'success',
            eventType: 'payment',
            gatewayResponse: body
        });

        // 5. Post-Payment Logic
        // - Send Email Invoice (Async job)
        // - Grant Access to Digital Products (if applic)
        // - Update Inventory (if not done at reservation)

        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
