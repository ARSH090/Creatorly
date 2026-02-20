
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { CourseModule } from '@/lib/models/CourseContent';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/products/[id]/modules
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

        const product = await Product.findOne({ _id: id, creatorId: user._id });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.productType !== 'course') {
            return NextResponse.json({ error: 'Product is not a course' }, { status: 400 });
        }

        const body = await req.json();

        // Get highest order index to append
        const lastModule = await CourseModule.findOne({ productId: id }).sort('-orderIndex');
        const nextOrder = lastModule ? lastModule.orderIndex + 1 : 0;

        const module = await CourseModule.create({
            productId: id,
            title: body.title,
            description: body.description,
            orderIndex: body.orderIndex !== undefined ? body.orderIndex : nextOrder,
            isFreePreview: body.isFreePreview || false
        });

        return NextResponse.json({ module }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating module:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
