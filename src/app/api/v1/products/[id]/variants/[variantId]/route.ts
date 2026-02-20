
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import ProductVariant from '@/lib/models/ProductVariant';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// PUT /api/v1/products/[id]/variants/[variantId]
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        await connectToDatabase();
        const { id, variantId } = await params;

        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isValidId(id) || !isValidId(variantId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Verify Product ownership
        const product = await Product.findOne({ _id: id, creatorId: user._id });
        if (!product) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        const body = await req.json();

        const variant = await ProductVariant.findOneAndUpdate(
            { _id: variantId, productId: id },
            { $set: { ...body, updatedAt: new Date() } },
            { new: true, runValidators: true }
        );

        if (!variant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        return NextResponse.json({ variant });

    } catch (error: any) {
        console.error('Error updating variant:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/v1/products/[id]/variants/[variantId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        await connectToDatabase();
        const { id, variantId } = await params;

        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isValidId(id) || !isValidId(variantId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Verify Product ownership
        const product = await Product.findOne({ _id: id, creatorId: user._id });
        if (!product) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        // Check if variant has active orders? (Placeholder logic)
        // const hasOrders = await Order.exists({ 'items.variantId': variantId });
        // if (hasOrders) return NextResponse.json({ error: 'Cannot delete variant with orders' }, { status: 400 });

        const result = await ProductVariant.deleteOne({ _id: variantId, productId: id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Variant deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting variant:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
