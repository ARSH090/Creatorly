import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withAuth } from '@/lib/firebase/withAuth';

export const GET = withAuth(async (req, user, { params }) => {
    try {
        await connectToDatabase();
        const product = await Product.findOne({ _id: (params as any).id, creatorId: user._id });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
});

export const PATCH = withAuth(async (req, user, { params }) => {
    try {
        const data = await req.json();
        await connectToDatabase();

        const product = await Product.findOneAndUpdate(
            { _id: (params as any).id, creatorId: user._id },
            { $set: { ...data, updatedAt: new Date() } },
            { new: true, runValidators: true }
        );

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error('Product Update Error:', error);
        return NextResponse.json({ error: 'Failed to update product', details: error.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (req, user, { params }) => {
    try {
        await connectToDatabase();
        const product = await Product.findOneAndUpdate(
            { _id: (params as any).id, creatorId: user._id },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Product deactivated' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
});
