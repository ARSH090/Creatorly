import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Order from '@/lib/models/Order';
import { connectToDatabase } from '@/lib/db/mongodb';

interface InvoiceData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  gstAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  paymentMethod: string;
  paymentDate: Date;
}

/**
 * Generate PDF invoice
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'A4',
  });

  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 14, 15);

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Order ID: ${invoiceData.orderId}`, 14, 25);
  doc.text(`Date: ${invoiceData.paymentDate.toISOString().split('T')[0]}`, 14, 31);

  // Customer details
  doc.text('Bill To:', 14, 40);
  doc.text(invoiceData.customerName, 14, 46);
  doc.text(invoiceData.customerEmail, 14, 52);

  // Items table
  const tableData = invoiceData.items.map((item) => [
    item.name,
    item.quantity.toString(),
    `₹${(item.price / 100).toFixed(2)}`,
    `₹${(item.total / 100).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.text(`Subtotal: ₹${((invoiceData.amount - invoiceData.gstAmount) / 100).toFixed(2)}`, 14, finalY);
  doc.text(`GST (18%): ₹${(invoiceData.gstAmount / 100).toFixed(2)}`, 14, finalY + 6);

  doc.setFont(undefined as any, 'bold');
  doc.text(`Total: ₹${(invoiceData.amount / 100).toFixed(2)}`, 14, finalY + 12);

  // Payment method
  doc.setFont(undefined as any, 'normal');
  doc.text(`Payment Method: ${invoiceData.paymentMethod}`, 14, finalY + 20);

  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for your purchase!', 14, 270);
  doc.text('© 2026 Creatorly', 14, 276);

  return Buffer.from(doc.output('arraybuffer')) as any;
}

/**
 * Generate and save invoice
 */
export async function saveInvoice(orderId: string): Promise<Buffer> {
  await connectToDatabase();

  const order = await Order.findById(orderId)
    .populate('productId')
    .populate('creatorId', 'displayName');

  if (!order) {
    throw new Error('Order not found');
  }

  const invoiceData: InvoiceData = {
    orderId: order._id.toString(),
    customerName: order.customerEmail.split('@')[0],
    customerEmail: order.customerEmail,
    amount: order.amount,
    gstAmount: Math.floor(order.amount - (order.amount / 1.18)), // 18% inclusive GST
    items: order.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
    paymentMethod: 'Razorpay',
    paymentDate: order.createdAt,
  };

  return generateInvoicePDF(invoiceData);
}
