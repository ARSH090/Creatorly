import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';

/**
 * GET /api/creator/orders/export
 * Export orders as CSV with proper escaping
 */
async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();

        // Limit to last 10,000 orders for safety
        const orders = await Order.find({ creatorId: user._id })
            .sort({ createdAt: -1 })
            .limit(10000)
            .populate('productId', 'title name')
            .lean();

        // Build CSV
        const headers = [
            'Order ID', 'Date', 'Buyer Name', 'Buyer Email',
            'Product', 'Amount', 'Status', 'Payment ID', 'Coupon'
        ];

        const rows = orders.map((o: any) => [
            o._id?.toString() || '',
            o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '',
            o.buyerName || o.customerName || '',
            o.buyerEmail || o.customerEmail || '',
            o.productId?.title || o.productId?.name || '',
            ((o.total || o.amount || 0) / 100).toFixed(2),
            o.status || '',
            o.razorpayPaymentId || o.paymentId || '',
            o.couponCode || '',
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
            }
        });
    } catch (error: any) {
        console.error('[ORDERS_EXPORT]', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
