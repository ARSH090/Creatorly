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
        doc.text(order.customerName || order.customerEmail, 120, 55);
        if (order.customerName) doc.text(order.customerEmail, 120, 60);
        doc.text(`Transaction ID: ${order.razorpayPaymentId || 'N/A'}`, 120, 65);

        // 4. Items Table
        const currency = order.currency || 'INR';
        const tableColumn = ["Item", "Quantity", "Price", "Total"];
        const tableRows = order.items.map(item => [
            item.name,
            item.quantity.toString(),
            `${currency} ${item.price.toFixed(2)}`,
            `${currency} ${(item.price * item.quantity).toFixed(2)}`
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] },
        });

        // 5. Detailed Total Breakdown
        let currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(100);

        const addLine = (label: string, value: number) => {
            if (value === 0) return;
            doc.text(label, 130, currentY);
            doc.text(`${currency} ${value.toFixed(2)}`, 170, currentY, { align: 'right' });
            currentY += 7;
        };

        addLine('Subtotal:', order.amount);
        if (order.taxAmount) addLine('Tax:', order.taxAmount);
        if (order.discountAmount) addLine('Discount:', -order.discountAmount);
        if (order.tipAmount) addLine('Tip:', order.tipAmount);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Grand Total:', 130, currentY + 5);
        doc.text(`${currency} ${order.total.toFixed(2)}`, 170, currentY + 5, { align: 'right' });

        // 6. Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text('Thank you for being part of the Creatorly economy.', 105, 285, { align: 'center' });

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
