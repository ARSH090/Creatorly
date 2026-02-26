import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { getMongoUser } from '@/lib/auth/get-user';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();

        // Update product metadata (draft mode)
        const product = await Product.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: data }, // We trust the frontend for partial draft data
            { new: true }
        );

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        return NextResponse.json({ success: true, updatedAt: product.updatedAt });

    } catch (error: any) {
        console.error('Product Autosave API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
