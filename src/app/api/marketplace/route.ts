import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import MarketplaceItem from '@/lib/models/MarketplaceItem';
import { z } from 'zod';
import { withAuth } from '@/lib/firebase/withAuth';

const marketplaceSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    category: z.enum(['template', 'plugin', 'theme', 'tool', 'course']),
    price: z.number().min(0),
    images: z.array(z.string().url()).optional(),
    tags: z.array(z.string()).optional(),
});

/**
 * GET /api/marketplace
 * Browse marketplace items
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const sort = searchParams.get('sort') || 'rating';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        await connectToDatabase();

        const query: Record<string, any> = { isActive: true };
        if (category) query.category = category;

        const items = await MarketplaceItem.find(query)
            .populate('seller', 'displayName avatar')
            .sort(sort === 'latest' ? { createdAt: -1 } : { rating: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await MarketplaceItem.countDocuments(query);

        return NextResponse.json({
            items,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Marketplace browse error:', error);
        return NextResponse.json(
            { error: 'Failed to browse marketplace' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/marketplace
 * Sell item on marketplace
 */
export const POST = withAuth(async (request, user) => {
    try {
        const body = await request.json();
        const validation = marketplaceSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const item = await MarketplaceItem.create({
            ...validation.data,
            seller: user._id,
        });

        return NextResponse.json(
            { item },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create marketplace item error:', error);
        return NextResponse.json(
            { error: 'Failed to create marketplace item' },
            { status: 500 }
        );
    }
});
