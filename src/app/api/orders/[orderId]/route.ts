import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';

async function getOrderHandler(req: NextRequest, user: any, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        await connectToDatabase();
        const { orderId } = await params;

        const order = await Order.findOne({
            _id: orderId,
            creatorId: user._id
        }).populate('items.productId').lean();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Get Order API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
    }
}

async function patchOrderHandler(req: NextRequest, user: any, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        await connectToDatabase();
        const { orderId } = await params;
        const body = await req.json();

        // Only allow updating specific fields
        const allowedUpdates = ['internalNotes', 'status'];
        const updates: any = {};

        allowedUpdates.forEach(key => {
            if (body[key] !== undefined) updates[key] = body[key];
        });

        const order = await Order.findOneAndUpdate(
            { _id: orderId, creatorId: user._id },
            { $set: updates },
            { new: true }
        );

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('Patch Order API Error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(getOrderHandler);
export const PATCH = withCreatorAuth(patchOrderHandler);
