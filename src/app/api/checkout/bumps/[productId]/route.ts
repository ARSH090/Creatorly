import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OrderBump from '@/lib/models/OrderBump';
import Product from '@/lib/models/Product';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// GET /api/checkout/bumps/:productId
export async function GET(req: NextRequest, { params }: { params: { productId: string } }) {
    try {
        await connectToDatabase();
        const { productId } = params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        const bumps = await OrderBump.find({
            triggerProductId: productId,
            isActive: true
        })
            .populate({
                path: 'bumpProductId',
                select: 'title description pricing coverImageUrl image'
            })
            .sort({ displayOrder: 1 })
            .lean();

        // Map bumps to the format expected by the UI
        const activeBumps = bumps.map((bump: any) => {
            const product = bump.bumpProductId;
            const originalPrice = product.pricing.basePrice;
            const discountedPrice = Math.round(originalPrice * (1 - bump.discountPct / 100));

            return {
                id: bump._id,
                bumpProductId: product._id,
                headline: bump.headline,
                description: bump.description || product.description,
                productImage: product.coverImageUrl || product.image,
                originalPrice,
                discountedPrice,
                currency: product.pricing.currency
            };
        });

        return NextResponse.json({ bumps: activeBumps });
    } catch (error: any) {
        console.error('Error fetching checkout bumps:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
