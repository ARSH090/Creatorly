import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';

async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'newest';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const filter: any = { creatorId: user._id, isDeleted: { $ne: true } };

        if (status && status !== 'All') {
            filter.status = status.toLowerCase();
        }

        if (type && type !== 'All') {
            filter.productType = type.toLowerCase();
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        let sortOption: any = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        if (sort === 'price_high') sortOption = { 'pricing.basePrice': -1 };
        if (sort === 'price_low') sortOption = { 'pricing.basePrice': 1 };
        if (sort === 'sales') sortOption = { totalSales: -1 };

        const [products, total, stats] = await Promise.all([
            Product.find(filter).sort(sortOption).skip(skip).limit(limit),
            Product.countDocuments(filter),
            Product.aggregate([
                { $match: { creatorId: user._id, isDeleted: { $ne: true } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
                        totalRevenue: { $sum: '$totalRevenue' }
                    }
                }
            ])
        ]);

        return NextResponse.json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            stats: stats[0] || { total: 0, published: 0, draft: 0, archived: 0, totalRevenue: 0 }
        });
    } catch (error: any) {
        console.error('Creator Products GET Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch products', error.message), { status: 500 });
    }
}

async function postHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        if (!body.title?.trim()) {
            return NextResponse.json(errorResponse('Product title is required'), { status: 400 });
        }

        // 1. Generate unique slug
        let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!baseSlug) baseSlug = 'product';
        let slug = baseSlug;
        let counter = 1;
        while (await Product.findOne({ creatorId: user._id, slug, isDeleted: { $ne: true } })) {
            slug = `${baseSlug}-${++counter}`;
        }

        // 2. Map fields carefully
        const productData = {
            creatorId: user._id,
            title: body.title.trim(),
            slug,
            description: body.description || '',
            shortDescription: body.shortDescription || body.description?.slice(0, 160) || '',
            productType: body.productType || 'digital_download',
            status: body.status || 'draft',
            pricing: {
                basePrice: Math.round((body.price || 0) * 100),
                currency: body.currency || 'INR',
                taxInclusive: body.taxInclusive || false
            },
            compareAtPrice: body.compareAtPrice ? Math.round(body.compareAtPrice * 100) : undefined,
            isFree: body.isFree || false,
            coverImageUrl: body.coverImageUrl || '',
            previewImages: body.previewImages || [],
            previewVideo: body.previewVideo || '',
            files: body.files || [],
            tags: body.tags || [],
            seo: {
                title: body.seoTitle || body.title,
                description: body.seoDescription || body.shortDescription || '',
                keywords: body.seoKeywords || []
            },
            thankYouMessage: body.thankYouMessage || '',
            limitedStock: body.limitedStock || false,
            stockCount: body.stockCount || -1
        };

        const product = await Product.create(productData);
        return NextResponse.json(product);
    } catch (error: any) {
        console.error('Creator Products POST Error:', error);
        return NextResponse.json(errorResponse('Failed to create product', error.message), { status: 500 });
    }
}

async function patchHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const { productIds, action } = await req.json();

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(errorResponse('No products selected'), { status: 400 });
        }

        const filter = { _id: { $in: productIds }, creatorId: user._id };
        let update: any = {};

        switch (action) {
            case 'publish': update.status = 'published'; break;
            case 'unpublish': update.status = 'draft'; break;
            case 'archive': update.status = 'archived'; break;
            case 'delete': update.isDeleted = true; break;
            default:
                return NextResponse.json(errorResponse('Invalid action'), { status: 400 });
        }

        const result = await Product.updateMany(filter, { $set: update });
        return NextResponse.json(successResponse(`${result.modifiedCount} products updated`));
    } catch (error: any) {
        console.error('Creator Products PATCH Error:', error);
        return NextResponse.json(errorResponse('Bulk action failed', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
export const PATCH = withCreatorAuth(patchHandler);
