import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { IInvoice } from '@/lib/models/Invoice';

/**
 * Generates a PDF invoice buffer
 */
export async function generateInvoicePDF(invoice: IInvoice): Promise<Buffer> {
    const doc = new jsPDF() as any;

    // Header
    doc.setFontSize(22);
    doc.text('INVOICE', 14, 20);

    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, 14, 35);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 40);

    // Customer Details
    doc.setFontSize(12);
    doc.text('Bill To:', 14, 55);
    doc.setFontSize(10);
    doc.text(invoice.customerDetails.name || 'Customer', 14, 62);
    doc.text(invoice.customerDetails.email, 14, 67);
    if (invoice.customerDetails.address?.street) {
        doc.text(`${invoice.customerDetails.address.street}, ${invoice.customerDetails.address.city}`, 14, 72);
        doc.text(`${invoice.customerDetails.address.state}, ${invoice.customerDetails.address.zip}`, 14, 77);
        doc.text(invoice.customerDetails.address.country || '', 14, 82);
    }

    // Line Items (Simplified for now)
    const tableRows = [
        ['Description', 'Qty', 'Unit Price', 'Total'],
        ['Digital Product Purchase', '1', `${invoice.currency} ${invoice.amount}`, `${invoice.currency} ${invoice.amount}`]
    ];

    doc.autoTable({
        startY: 95,
        head: [tableRows[0]],
        body: [tableRows[1]],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] } // Indigo-500
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Paid: ${invoice.currency} ${invoice.amount}`, 140, finalY);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Thank you for your business!', 14, 280);
    doc.text('Powered by Creatorly', 14, 285);

    return Buffer.from(doc.output('arraybuffer'));
}
