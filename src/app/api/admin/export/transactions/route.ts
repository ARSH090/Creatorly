import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withAdminAuth } from '@/lib/auth/withAuth';

export const GET = withAdminAuth(async (req: NextRequest) => {
    try {
        await connectToDatabase();
        const orders = await Order.find({ status: 'completed' }).lean();

        const headers = ['Order #', 'Customer Email', 'Amount', 'Currency', 'Method', 'Paid At'];
        const rows = orders.map(o => [
            o.orderNumber,
            o.customerEmail,
            o.amount,
            o.currency,
            o.paymentMethod || 'razorpay',
            o.paidAt ? new Date(o.paidAt).toISOString() : new Date(o.createdAt).toISOString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="transactions_export_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
