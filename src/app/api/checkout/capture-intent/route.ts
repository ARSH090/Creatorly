import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AbandonedCheckout from '@/lib/models/AbandonedCheckout';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/types/api';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { email, productId } = await req.json();

        if (!email || !productId) {
            return NextResponse.json(errorResponse('Email and Product ID required'), { status: 400 });
        }

        // 1. Get product price
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json(errorResponse('Product not found'), { status: 404 });
        }

        // 2. Upsert abandoned checkout (don't create duplicate if already exists for this email/product and not recovered)
        const checkout = await AbandonedCheckout.findOneAndUpdate(
            { buyerEmail: email, productId, status: 'abandoned' },
            {
                creatorId: product.creatorId,
                productPrice: product.price,
                capturedAt: new Date(),
                recoveryEnded: false
            },
            { upsert: true, new: true }
        );

        // 3. Enqueue 1-hour delay recovery job if it's new/upserted and first time queueing
        // Actually, just having upsert handles the creation. We can enqueue it, and the worker will check if it's already recovered.
        // To avoid multiple queueing, we only enqueue if we've just captured or it's within 1 hour. But it's safe to just queue it, 
        // the worker can deduplicate based on checkout._id.
        const { mailQueue } = await import('@/lib/queue');
        await mailQueue.add('abandoned-cart-recovery',
            { checkoutId: checkout._id.toString() },
            { delay: 1000 * 60 * 60, jobId: `recovery-${checkout._id.toString()}` }
        );

        return NextResponse.json(successResponse('Intent captured'));
    } catch (error: any) {
        console.error('Capture Intent Error:', error);
        return NextResponse.json(errorResponse('Failed to capture intent', error.message), { status: 500 });
    }
}
