import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { razorpay } from '@/lib/razorpay';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { getCurrentUser } from '@/lib/firebase/server-auth';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { cart, customer } = await req.json();

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // 1. Calculate Total & Validate Items
        let totalAmount = 0;
        const items = [];
        let creatorId = null;

        for (const cartItem of cart) {
            const product = await Product.findById(cartItem.id);
            if (!product) continue;

            if (!creatorId) creatorId = product.creatorId;

            totalAmount += product.price * cartItem.quantity;
            items.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                type: product.type
            });
        }

        // Add 18% GST (Tax)
        const amountWithTax = totalAmount * 1.18;
        const amountInPaise = Math.round(amountWithTax * 100);

        // 2. Create Razorpay Order
        const user = await getCurrentUser();

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                customerName: customer.name,
                customerEmail: customer.email,
                itemsCount: items.length,
                userId: user?.id || 'guest',
                productIds: items.map(i => i.productId.toString()).join(',')
            }
        });

        // 3. Save Order in Database

        await Order.create({
            items,
            creatorId,
            userId: user?.id ? user.id : null,
            customerEmail: customer.email,
            amount: amountWithTax,
            currency: 'INR',
            razorpayOrderId: razorpayOrder.id,
            status: 'pending',
            metadata: {
                customerName: customer.name,
                customerPhone: customer.phone
            }
        });

        return NextResponse.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });

    } catch (error: any) {
        console.error('Razorpay Order Creation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
