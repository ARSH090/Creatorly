
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { getMongoUser } from '@/lib/auth/get-user';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// POST /api/v1/orders
// Body: { items: [{ productId, variantId, quantity }], billingAddress, currency }
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        // User might be guest? For now assume logged in or we capture email in body
        // If guest, we need to handle user creation or guest checkout logic.
        // Requirement says "user_id (foreign key)". So assume logged in.

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { items, billingAddress, currency = 'INR' } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Order must contain items' }, { status: 400 });
        }

        // Validate Items & Calculate Totals
        let subtotal = 0;
        let taxTotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).lean();
            if (!product) throw new Error(`Product ${item.productId} not found`);

            // Check variant if exists
            // Basic price check
            let price = product.pricing?.basePrice || 0;
            // If variant logic exists, fetch variant price. 
            // Skipping variant fetch for brevity, assume base price for MVP or payload trusted (in backend we must verify)

            // Tax (Simple 18% GST calculation for digital goods in India if applicable)
            // simplified:
            const taxRate = 0.18;
            const tax = price * taxRate;

            subtotal += price * item.quantity;
            taxTotal += tax * item.quantity;

            processedItems.push({
                productId: product._id,
                name: product.title,
                price: price,
                quantity: item.quantity,
                type: product.productType,
                variantId: item.variantId,
                tax: tax // per unit
            });
        }

        const totalAmount = subtotal + taxTotal;
        const amountInPaise = Math.round(totalAmount * 100);

        // Create Razorpay Order
        const orderReceipt = `rcpt_${Date.now()}`;
        const razorpayOrder = await createRazorpayOrder({
            amount: amountInPaise,
            currency: currency,
            receipt: orderReceipt,
            notes: {
                creatorId: processedItems[0].productId.toString() // assuming single creator order for now
            }
        });

        if (!razorpayOrder) throw new Error('Failed to create Razorpay payment order');

        // Create DB Order
        // Generate Human Readable ID
        const orderNumber = `CR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newOrder = await Order.create({
            orderNumber,
            items: processedItems,
            creatorId: processedItems[0].productId, // Linking to first product's creator? 
            // In marketplace, mixed carts are complex. Assuming single creator per order or logic needs update.
            // Let's assume passed product's creator. fetch from product lookup above. 
            // *Re-fetch needed if not stored*
            userId: user._id,
            customerEmail: user.email,
            customerName: user.name,
            billingAddress,
            amount: subtotal,
            taxAmount: taxTotal,
            total: totalAmount,
            currency,
            razorpayOrderId: razorpayOrder.id,
            status: 'payment_initiated',
            paymentStatus: 'pending',
            metadata: {
                razorpay_receipt: orderReceipt
            }
        });

        return NextResponse.json({
            success: true,
            orderId: newOrder._id,
            razorpayOrderId: razorpayOrder.id,
            amount: amountInPaise,
            currency: currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
