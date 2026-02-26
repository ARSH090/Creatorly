import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { getMongoUser } from '@/lib/auth/get-user';
import { getCached, invalidateCache } from '@/lib/cache';
import mongoose from 'mongoose';

// FORCE DYNAMIC for these routes as they depend on request data/auth
export const dynamic = 'force-dynamic';

// GET /api/v1/products
// Query params: page, limit, status, category_id, product_type, search, sort_by
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getMongoUser();
        // If no user, we might still allow public access to active products?
        // Requirements say: "Auth: Creator or Team Member with product access" implies restricted.
        // But for a marketplace, public listing is needed. 
        // Assuming this is the ADMIN/CREATOR list view.
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');
        const categoryId = searchParams.get('category_id');
        const productType = searchParams.get('product_type');
        const search = searchParams.get('search');
        const sortBy = searchParams.get('sort_by') || '-createdAt';

        const query: any = {};

        // Filter by creator
        query.creatorId = user._id;

        if (status) query.status = status;
        if (categoryId) query.categoryId = categoryId;
        if (productType) query.productType = productType;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const cacheKey = `products:${user._id}:${page}:${limit}:${status || 'all'}:${productType || 'all'}:${sortBy}`;

        const { products, total } = await getCached(cacheKey, 60, async () => {
            const [products, total] = await Promise.all([
                Product.find(query)
                    .sort(sortBy)
                    .skip(skip)
                    .limit(limit)
                    .select('title pricing status productType categoryId createdAt slug thumbnail image isActive')
                    .populate('categoryId', 'name')
                    .lean(),
                Product.countDocuments(query)
            ]);
            return { products, total };
        });

        return NextResponse.json({
            products,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/products
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const creatorId = user._id;

        const body = await req.json();

        // Basic Validation
        if (!body.title || body.title.length < 3 || body.title.length > 100) {
            return NextResponse.json({ error: 'Title must be between 3 and 100 characters' }, { status: 400 });
        }

        // Check Slug Uniqueness
        const existingProduct = await Product.findOne({ slug: body.slug, creatorId });
        if (existingProduct) {
            return NextResponse.json({ error: 'Slug already exists for this creator' }, { status: 400 });
        }

        if (body.pricing && body.pricing.basePrice < 0) {
            return NextResponse.json({ error: 'Price must be non-negative' }, { status: 400 });
        }

        const product = await Product.create({
            ...body,
            creatorId, // Enforce creator association
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Invalidate caches
        await Promise.all([
            invalidateCache(`storefront:${user.username.toLowerCase()}`),
            invalidateCache(`products:list:${creatorId}`) // Partial invalidation for default view
        ]).catch(err => console.error('Cache invalidation error:', err));

        return NextResponse.json({ product }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
