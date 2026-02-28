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

        const filter: any = { creatorId: user._id };
        if (status && status !== 'All') filter.status = status.toLowerCase();
        if (type && type !== 'All') filter.productType = type.toLowerCase();

        const products = await Product.find(filter)
            .sort({ createdAt: -1 });

        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Creator Products GET Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch products', error.message), { status: 500 });
    }
}

async function postHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        // Validate required fields
        if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
            return NextResponse.json(errorResponse('Product title is required'), { status: 400 });
        }
        if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
            return NextResponse.json(errorResponse('Invalid price — must be a non-negative number'), { status: 400 });
        }

        // 1. Generate unique slug
        let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;
        while (await Product.findOne({ creatorId: user._id, slug })) {
            slug = `${baseSlug}-${++counter}`;
        }

        // 2. Explicit allowlist — prevent mass assignment
        const product = await Product.create({
            title: body.title.trim().slice(0, 200),
            description: body.description?.trim().slice(0, 5000) || '',
            price: body.price || 0,
            productType: body.productType || 'digital',
            pricingType: body.pricingType || 'fixed',
            thumbnail: body.thumbnail || '',
            files: body.files || [],
            tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
            category: body.category || '',
            isPublic: body.isPublic ?? false,
            downloadLimit: body.downloadLimit || 3,
            accessDuration: body.accessDuration,
            creatorId: user._id,
            slug,
            productNumber: `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            status: 'draft',
            pricing: {
                basePrice: (body.price || 0) * 100,
                currency: body.currency || 'INR'
            }
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('Creator Products POST Error:', error);
        return NextResponse.json(errorResponse('Failed to create product', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
