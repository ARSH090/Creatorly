import { razorpay } from '@/lib/payments/razorpay';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { amount, currency = 'INR', receipt, productId, creatorId, customerEmail } = await req.json();

        if (!amount || !productId || !creatorId || !customerEmail) {
            return NextResponse.json({ error: 'Missing required checkout fields' }, { status: 400 });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const rzpOrder = await razorpay.orders.create(options);

        // Save preliminary order to MongoDB
        await connectToDatabase();
        await Order.create({
            productId,
            creatorId,
            customerEmail,
            amount,
            razorpayOrderId: rzpOrder.id,
            status: 'pending'
        });

        return NextResponse.json({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
        });
    } catch (error: any) {
        console.error('Razorpay order error:', error);
        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }
}
