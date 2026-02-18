import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { Lesson, Module } from '@/lib/models/CourseContent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { slugify } from '@/lib/utils/slugify';

/**
 * POST /api/creator/courses/:id/lessons
 * Add lesson to course
 * Body: { moduleId, title, description, videoUrl?, content?, order? }
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const courseId = params.id;

    const body = await req.json();
    const { moduleId, title, description, videoUrl, content, order, durationMinutes } = body;

    if (!title) throw new Error('Lesson title is required');
    if (!moduleId) throw new Error('Module ID is required');

    const course = await Product.findOne({
        _id: courseId,
        creatorId: user._id,
        type: 'course'
    });

    if (!course) throw new Error('Course not found');

    const targetModule = await Module.findOne({ _id: moduleId, productId: courseId });
    if (!targetModule) throw new Error('Module not found for this course');

    // Determine lesson order
    let lessonOrder = order;
    if (lessonOrder === undefined) {
        const lastLesson = await Lesson.findOne({ moduleId }).sort({ order: -1 });
        lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
    }

    const lesson = await Lesson.create({
        moduleId,
        productId: courseId,
        title,
        slug: slugify(title) + '-' + Math.random().toString(36).substring(7),
        description,
        videoUrl,
        content,
        durationMinutes: durationMinutes || 0,
        order: lessonOrder,
        isPreview: false,
        isActive: true
    });

    return {
        success: true,
        lesson,
        message: 'Lesson created successfully'
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
export const GET = withCreatorAuth(withErrorHandler(async (req: NextRequest, user: any, context: any) => {
    await connectToDatabase();
    const params = await context.params;
    const courseId = params.id;
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');

    const query: any = { productId: courseId };
    if (moduleId) query.moduleId = moduleId;

    const lessons = await Lesson.find(query).sort({ order: 1 });
    return { lessons };
}));
