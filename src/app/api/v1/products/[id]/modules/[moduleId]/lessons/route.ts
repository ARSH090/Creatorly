
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { CourseModule, CourseLesson } from '@/lib/models/CourseContent';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/products/[id]/modules/[moduleId]/lessons
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    try {
        await connectToDatabase();
        const { id, moduleId } = await params;

        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isValidId(id) || !isValidId(moduleId)) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        // Verify Product & Ownership
        const product = await Product.findOne({ _id: id, creatorId: user._id });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Verify Module belongs to Product
        const courseModule = await CourseModule.findOne({ _id: moduleId, productId: id });
        if (!courseModule) {
            return NextResponse.json({ error: 'Module not found for this product' }, { status: 404 });
        }

        const body = await req.json();

        // Validate content based on type
        if (body.lessonType === 'video' && !body.content?.videoUrl) {
            return NextResponse.json({ error: 'Video URL required for video lessons' }, { status: 400 });
        }

        // Get highest order index
        const lastLesson = await CourseLesson.findOne({ moduleId }).sort('-orderIndex');
        const nextOrder = lastLesson ? lastLesson.orderIndex + 1 : 0;

        const lesson = await CourseLesson.create({
            moduleId,
            title: body.title,
            lessonType: body.lessonType,
            content: body.content,
            durationMinutes: body.durationMinutes || 0,
            orderIndex: body.orderIndex !== undefined ? body.orderIndex : nextOrder,
            isFreePreview: body.isFreePreview || false
        });

        return NextResponse.json({ lesson }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating lesson:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
