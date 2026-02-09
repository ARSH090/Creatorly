import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/firebase/withAuth';

import { ProductSchema } from '@/lib/validation/schemas';

export const POST = withAuth(async (req, user) => {
    try {
        const body = await req.json();
        const validation = ProductSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.format()
            }, { status: 400 });
        }

        const data = validation.data;
        await connectToDatabase();

        // 1. Enforce Plan Limits
        // user object is already the Mongoose document, so we can access planLimits directly
        const maxProducts = user.planLimits?.maxProducts ?? 3; // Default to 3 (Free Tier) if not set

        const currentCount = await Product.countDocuments({
            creatorId: user._id,
            isActive: true
        });

        if (currentCount >= maxProducts) {
            return NextResponse.json({
                error: 'Plan limit reached',
                message: `You have reached the maximum of ${maxProducts} products for your plan. Please upgrade to add more.`,
                code: 'LIMIT_EXCEEDED'
            }, { status: 403 });
        }

        // 2. Map Validated Data to Product Schema
        const productData = {
            creatorId: user._id,
            name: data.name,
            slug: data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            description: data.description || '',
            price: data.price,
            currency: data.currency,
            paymentType: 'one_time',
            category: data.category,
            image: data.image,
            type: data.type,
            status: data.isPublic ? 'published' : 'draft',
            files: data.files || [],
            accessRules: {
                immediateAccess: true,
                requiresApproval: false
            },
            seo: {
                metaTitle: data.name,
                metaDescription: (data.description || '').slice(0, 160),
                keywords: []
            },
            isActive: data.isPublic,
            isFeatured: data.isFeatured || data.isFeaturedInCollections
        } as any;

        // 3. Create Product
        const product = await Product.create(productData);

        return NextResponse.json({
            success: true,
            productId: product._id,
            product
        }, { status: 201 });

    } catch (error: any) {
        console.error('Product Creation Error:', error);
        return NextResponse.json({
            error: 'Failed to create product',
            details: error.message
        }, { status: 500 });
    }
});

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const creatorId = searchParams.get('creatorId');

        const query = creatorId ? { creatorId } : {};
        const products = await Product.find(query).sort({ createdAt: -1 });

        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
