import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
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

        // 1. Enforce Tier-Based Plan Limits (NEW TIER SYSTEM)
        const { checkFeatureAccess } = await import('@/lib/middleware/checkFeatureAccess');
        const currentCount = await Product.countDocuments({
            creatorId: user._id,
            status: { $in: ['published', 'active'] }
        });

        const featureCheck = await checkFeatureAccess(user._id.toString(), 'products', currentCount);

        if (!featureCheck.allowed) {
            return NextResponse.json(
                errorResponse('Upgrade required to create more products', {
                    code: featureCheck.errorCode,
                    current: featureCheck.current,
                    limit: featureCheck.limit,
                    upgrade_url: featureCheck.upgradeUrl || '/pricing?feature=products'
                }),
                { status: 403 }
            );
        }


        // 2. Map Validated Data to Product Schema
        const productName = data.name || data.title || 'Untitled';
        const productData = {
            creatorId: user._id,
            title: productName,
            slug: productName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 7),
            description: sanitizeHTML(data.description || ''),
            pricing: {
                basePrice: data.price || 0,
                currency: data.currency || 'INR',
                taxInclusive: false
            },
            paymentType: 'one_time',
            category: data.category,
            image: data.image,
            productType: data.productType || 'digital_download',
            status: data.isPublic ? 'active' : 'draft',
            isActive: !!data.isPublic,
            files: data.files || [],
            accessRules: {
                immediateAccess: true,
                requiresApproval: false
            },
            seo: {
                metaTitle: productName,
                metaDescription: (data.description || '').slice(0, 160),
                keywords: []
            },
            isFeatured: !!(data.isFeatured || data.isFeaturedInCollections),

            // Variants
            hasVariants: data.hasVariants,
            variants: data.variants || []
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
            status: 'active',
            isActive: true
        };
        const products = await Product.find(query).sort({ createdAt: -1 });

        return NextResponse.json(successResponse(products));
    } catch (error: any) {
        return NextResponse.json(errorResponse('Failed to fetch products'), { status: 500 });
    }
}
