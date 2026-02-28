import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import { DigitalDeliveryService } from '@/lib/services/digitalDelivery';
import { auditLog } from '@/lib/utils/auditLogger';

export async function POST(
    req: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { orderId } = params;

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify creator owns the order
        if (order.creatorId.toString() !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Allow manual fulfillment if it's paid or if the creator explicitly wants to force it
        // (sometimes needed for direct bank transfers confirmed manually)
        if (order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.status = 'completed';
            order.paidAt = new Date();
        }

        await order.save();

        // Trigger Fulfillment
        await DigitalDeliveryService.fulfillOrder(order._id.toString());

        await auditLog({
            userId,
            action: 'MANUAL_FULFILLMENT',
            resourceType: 'order',
            resourceId: order._id.toString(),
            metadata: { orderNumber: order.orderNumber }
        });

        return NextResponse.json({ success: true, message: 'Order fulfilled manually' });

    } catch (error: any) {
        console.error('[MANUAL FULFILL API ERROR]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
