import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/firebase/withAuth';

async function handler(req: NextRequest, user: any, context: any) {
    try {
        await connectToDatabase();
        // Fetch ALL products for this creator (drafts, active, etc)
        const products = await Product.find({ creatorId: user._id })
            .sort({ createdAt: -1 });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Creator Products API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
