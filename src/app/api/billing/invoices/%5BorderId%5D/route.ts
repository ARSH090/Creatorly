import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withAuth } from '@/lib/auth/withAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * GET /api/billing/invoices/[orderId]
 * Generates a PDF invoice for a specific order
 */
async function handler(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        await connectToDatabase();
        const { orderId } = await params;
        const sessionUser = (req as any).user;

        const order = await Order.findById(orderId).populate('creatorId');
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Authorization: User must be the buyer or the creator
        const canAccess = order.userId.toString() === sessionUser._id.toString() ||
            order.creatorId._id.toString() === sessionUser._id.toString();

        if (!canAccess) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 1. Initialize PDF
        const doc = new jsPDF();
        const creator: any = order.creatorId;

        // 2. Add Header
        doc.setFontSize(22);
        doc.setTextColor(99, 102, 241); // Indigo-500
        doc.text('CREATORLY INVOICE', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Invoice #: INV-${order._id.toString().slice(-6).toUpperCase()}`, 14, 30);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35);

        // 3. Billing Sections
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('From:', 14, 50);
        doc.setFontSize(10);
        doc.text(creator.displayName || creator.username, 14, 55);
        doc.text(creator.email, 14, 60);

        doc.setFontSize(12);
        doc.text('To:', 120, 50);
        doc.setFontSize(10);
        doc.text(order.customerEmail, 120, 55);
        doc.text(`Transaction ID: ${order.razorpayPaymentId || 'N/A'}`, 120, 60);

        // 4. Items Table
        const tableColumn = ["Item", "Quantity", "Price", "Total"];
        const tableRows = order.items.map(item => [
            item.name,
            item.quantity.toString(),
            `INR ${item.price.toFixed(2)}`,
            `INR ${(item.price * item.quantity).toFixed(2)}`
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] },
        });

        // 5. Total
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`Grand Total: INR ${order.amount.toFixed(2)}`, 140, finalY);

        // 6. Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Thank you for being part of the Creatorly economy.', 105, 280, { align: 'center' });

        // Generate Buffer
        const pdfBuffer = doc.output('arraybuffer');

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=Invoice-${orderId}.pdf`
            }
        });

    } catch (error: any) {
        console.error('[Invoice Gen] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withAuth(handler);
