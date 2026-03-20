import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { razorpay } from '@/lib/payments/razorpay';
import { Order } from '@/lib/models/Order';
import { nanoid } from 'nanoid';

export interface WhatsAppCheckoutSession {
    orderId: string;
    orderNumber: string;
    upiLink: string;
    qrCodeUrl: string;
    amount: number;
    productName: string;
    expiresAt: Date;
}

/**
 * Creates a Razorpay payment link suitable for WhatsApp sharing
 * When paid, webhook fulfills the order automatically
 */
export async function createWhatsAppCheckoutLink(params: {
    productId: string;
    buyerPhone: string;
    buyerName?: string;
    creatorId: string;
}): Promise<WhatsAppCheckoutSession> {
    await connectToDatabase();

    const product = await Product.findById(params.productId);
    if (!product || product.status !== 'active') throw new Error('Product not found');

    const creator = await User.findById(params.creatorId);
    const amount = product.pricing?.basePrice || product.price || 0;

    // Create Razorpay Payment Link (auto-expires in 30 mins)
    const paymentLink = await (razorpay as any).paymentLink.create({
        amount,
        currency: 'INR',
        accept_partial: false,
        description: `Purchase: ${product.title}`,
        customer: {
            name: params.buyerName || 'Customer',
            contact: params.buyerPhone,
        },
        notify: { sms: true, email: false },
        reminder_enable: false,
        expire_by: Math.floor((Date.now() + 30 * 60 * 1000) / 1000), // 30 min expiry
        notes: {
            productId: params.productId,
            creatorId: params.creatorId,
            buyerPhone: params.buyerPhone,
            source: 'whatsapp',
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/razorpay/verify-payment`,
        callback_method: 'get',
    });

    const orderNumber = `WA-${nanoid(8).toUpperCase()}`;
    const order = await Order.create({
        orderNumber,
        items: [{ productId: product._id, name: product.title, price: amount, quantity: 1, type: product.productType }],
        creatorId: params.creatorId,
        customerEmail: `${params.buyerPhone}@whatsapp.lead`,
        customerName: params.buyerName || 'WhatsApp Customer',
        amount,
        total: amount,
        currency: 'INR',
        razorpayOrderId: paymentLink.id,
        status: 'pending',
        paymentStatus: 'pending',
        metadata: { source: 'whatsapp', buyerPhone: params.buyerPhone },
    });

    return {
        orderId: order._id.toString(),
        orderNumber,
        upiLink: paymentLink.short_url,
        qrCodeUrl: `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(paymentLink.short_url)}`,
        amount,
        productName: product.title,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
}

/**
 * Formats the WhatsApp message to send to buyer with payment link
 */
export function formatWhatsAppPaymentMessage(session: WhatsAppCheckoutSession, creatorName: string): string {
    const amountInRupees = Math.round(session.amount / 100);
    return `Hi! 👋\n\nYou requested: *${session.productName}*\n\n💰 Amount: *₹${amountInRupees.toLocaleString('en-IN')}*\n\n🔗 Pay here:\n${session.upiLink}\n\n⏰ Link expires in 30 minutes\n\nAfter payment, you'll receive your product instantly!\n\n— ${creatorName} via Creatorly`;
}
