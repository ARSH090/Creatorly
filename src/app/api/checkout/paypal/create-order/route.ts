import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { createPayPalOrder } from '@/lib/payments/paypal';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { productId, amount } = await req.json();

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Use passed amount (for PWYW) or product price
        const finalAmount = amount || product.price;

        const order = await createPayPalOrder(finalAmount, product.pricing?.currency || 'USD');

        return NextResponse.json({ id: order.id });
    } catch (error: any) {
        console.error('PayPal Create Order Error:', error);
        return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
    }
}
