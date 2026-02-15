import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { sanitizeHTML } from '@/utils/sanitizers';
import { successResponse, errorResponse } from '@/types/api';

import { ProductSchema } from '@/lib/validation/schemas';

export const POST = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const validation = ProductSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                errorResponse('Validation failed', validation.error.format()),
                { status: 400 }
            );
        }

        const data = validation.data;
        await connectToDatabase();

        // 1. Enforce Plan Limits
        const maxProducts = user.planLimits?.maxProducts ?? 3;
        const currentCount = await Product.countDocuments({
            creatorId: user._id,
            status: { $in: ['published', 'active'] }
        });

        if (currentCount >= maxProducts) {
            return NextResponse.json(
                errorResponse('Plan limit reached', {
                    current: currentCount,
                    limit: maxProducts,
                    upgradeUrl: '/dashboard/upgrade'
                }),
                { status: 403 }
            );
        }



        // 2. Map Validated Data to Product Schema
        const productData = {
            creatorId: user._id,
            name: data.name,
            slug: data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            description: sanitizeHTML(data.description || ''),
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

        return NextResponse.json(
            successResponse(product, 'Product created successfully'),
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Product Creation Error:', error);
        return NextResponse.json(
            errorResponse('Failed to create product', error.message),
            { status: 500 }
        );
    }
});

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const creatorId = searchParams.get('creatorId');

        if (!creatorId) {
            return NextResponse.json([]);
        }

        const query = {
            creatorId,
            status: 'published',
            isActive: true
        };
        const products = await Product.find(query).sort({ createdAt: -1 });

        return NextResponse.json(successResponse(products));
    } catch (error: any) {
        return NextResponse.json(errorResponse('Failed to fetch products'), { status: 500 });
    }
}
