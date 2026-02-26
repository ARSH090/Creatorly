import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AbandonedCheckout } from '@/lib/models/AbandonedCheckout';
import Product from '@/lib/models/Product';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { email, productId, name, amount } = await req.json();

        if (!email || !productId) {
            return NextResponse.json({ error: 'Email and Product ID required' }, { status: 400 });
        }

        const product = await Product.findById(productId);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Upsert abandoned checkout
        const abandoned = await AbandonedCheckout.findOneAndUpdate(
            { buyerEmail: email.toLowerCase(), productId: productId, status: 'abandoned' },
            {
                creatorId: product.creatorId,
                buyerName: name,
                productPrice: amount || product.price,
                capturedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, id: abandoned._id });

    } catch (error: any) {
        console.error('Capture Lead API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
