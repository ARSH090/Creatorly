import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import CreatorProfile from '@/lib/models/CreatorProfile';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await connectToDatabase();
        const { slug } = await params;

        // 1. Fetch Product
        const product = await Product.findOne({ slug, isActive: true });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 2. Fetch Creator Info
        const creator = await User.findById(product.creatorId)
            .select('username displayName avatar bio');

        const profile = await CreatorProfile.findOne({ creatorId: product.creatorId })
            .select('storeName logo theme');

        // 3. Fetch Related Products (same creator, excluding current)
        const relatedProducts = await Product.find({
            creatorId: product.creatorId,
            _id: { $ne: product._id },
            isActive: true
        }).limit(4).select('name slug price currency image type');

        return NextResponse.json({
            product,
            creator: {
                ...creator?.toObject(),
                storeName: profile?.storeName,
                logo: profile?.logo,
                theme: profile?.theme
            },
            relatedProducts
        });
    } catch (error: any) {
        console.error('Fetch product by slug error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
