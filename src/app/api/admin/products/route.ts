import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withAdminAuth } from '@/lib/auth/withAuth';

/**
 * GET /api/admin/products
 * List all products with creator info
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const productType = searchParams.get('type');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};

    if (status) query.status = status;
    if (productType) query.type = productType;

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('creatorId', 'displayName email username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(query)
    ]);

    return NextResponse.json({
        success: true,
        data: {
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}

export const GET = withAdminAuth(handler);
