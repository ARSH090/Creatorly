import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { errorResponse } from '@/types/api';

/**
 * GET /api/orders/public/:id
 * Fetch minimal order details for the success page
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const order = await Order.findById(id).select('orderNumber items customerEmail amount currency metadata paymentStatus status');

        if (!order) {
            return NextResponse.json(errorResponse('Order not found'), { status: 404 });
        }

        // Only allow success page to view if paid
        if (order.paymentStatus !== 'paid' && order.status !== 'completed' && order.amount > 0) {
            return NextResponse.json(errorResponse('Payment not verified'), { status: 403 });
        }

        return NextResponse.json({
            success: true,
            order
        });
    } catch (error: any) {
        console.error('Public Order API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch order'), { status: 500 });
    }
}
