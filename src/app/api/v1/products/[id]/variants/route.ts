
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import ProductVariant from '@/lib/models/ProductVariant';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/products/[id]/variants
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isValidId(id)) {
            return NextResponse.json({ error: 'Invalid Product ID' }, { status: 400 });
        }

        // Verify Product ownership
        const product = await Product.findOne({ _id: id, creatorId: user._id });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const body = await req.json();

        // Check if variant name exists for this product
        const existingVariant = await ProductVariant.findOne({ productId: id, variantName: body.variantName });
        if (existingVariant) {
            return NextResponse.json({ error: 'Variant name already exists for this product' }, { status: 400 });
        }

        const variant = await ProductVariant.create({
            productId: id,
            ...body
        });

        // Update product metadata if needed (e.g. hasVariants flag)
        // Check "hasVariants" was in deprecated schema, maybe useful for frontend optimization
        // But for now we just return the variant.

        return NextResponse.json({ variant }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating variant:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
