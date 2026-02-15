import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { successResponse, errorResponse } from '@/types/api';

async function handler(req: NextRequest, user: any, context: any) {
    try {
        await connectToDatabase();
        // Fetch ALL products for this creator (drafts, active, etc)
        const products = await Product.find({ creatorId: user._id })
            .sort({ createdAt: -1 });

        return NextResponse.json(successResponse(products));
    } catch (error: any) {
        console.error('Creator Products API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch products', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
