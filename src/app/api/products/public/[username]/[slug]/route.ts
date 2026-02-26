import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { errorResponse } from '@/types/api';

export async function GET(req: NextRequest, { params }: any) {
    try {
        const { username, slug } = params;
        await connectToDatabase();

        // 1. Find creator by username
        const creator = await User.findOne({ username }).select('displayName avatar username bio');
        if (!creator) {
            return NextResponse.json(errorResponse('Creator not found'), { status: 404 });
        }

        // 2. Find product by creator and slug
        const product = await Product.findOne({
            creatorId: creator._id,
            slug,
            status: 'published'
        });

        if (!product) {
            return NextResponse.json(errorResponse('Product not found'), { status: 404 });
        }

        // 3. Return product + creator info
        return NextResponse.json({
            product,
            creator: {
                name: creator.displayName,
                image: creator.avatar,
                username: creator.username,
                bio: creator.bio
            }
        });
    } catch (error: any) {
        console.error('Public Product API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch product', error.message), { status: 500 });
    }
}
