import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/billing/gstr1
 * Generates a GSTR-1 compatible CSV export for a given month
 * Query params: month (1-12), year (YYYY)
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const orders = await Order.find({
        creatorId: user._id,
        paymentStatus: 'paid',
        currency: 'INR',
        createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    if (orders.length === 0) {
        return new Response('No orders found for this period', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    // GSTR-1 B2C CSV format (simplified — India GST B2C small invoice)
    const rows = [
        ['GSTIN of Recipient', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Place of Supply', 'Customer Name', 'Customer Email'],
    ];

    for (const order of orders) {
        const invoiceDate = new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN');
        const taxable = (order.total || 0) / 118 * 100; // reverse-calculate taxable from GST-inclusive
        const gst = (order.total || 0) - taxable;
        const gstDetails = order.gstDetails as any;

        rows.push([
            gstDetails?.gstin || 'URP', // Unregistered Person
            order.orderNumber || order._id.toString(),
            invoiceDate,
            ((order.total || 0) / 100).toFixed(2),
            (taxable / 100).toFixed(2),
            gstDetails?.cgst ? (gstDetails.cgst).toFixed(2) : (gst / 200).toFixed(2),
            gstDetails?.sgst ? (gstDetails.sgst).toFixed(2) : (gst / 200).toFixed(2),
            gstDetails?.igst ? (gstDetails.igst).toFixed(2) : '0.00',
            gstDetails?.stateOfConsumption || '27', // 27 = Maharashtra
            order.customerName || '',
            order.customerEmail || '',
        ]);
    }

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `GSTR1_${year}_${String(month).padStart(2,'0')}_${user.username}.csv`;

    return new Response(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}

export const GET = withCreatorAuth(withErrorHandler(handler));
