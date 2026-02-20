import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { CourseLesson as Lesson, CourseModule as Module } from '@/lib/models/CourseContent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { slugify } from '@/lib/utils/slugify';

/**
 * POST /api/creator/courses/:id/lessons
 * Create a new lesson in a module
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const courseId = params.id;

    const body = await req.json();
    const { title, description, videoUrl, content, durationMinutes, order, moduleId } = body;

    if (!title || !moduleId) {
        throw new Error('Title and Module ID are required');
    }

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
        const lastLesson = await Lesson.findOne({ moduleId }).sort({ orderIndex: -1 });
        lessonOrder = lastLesson ? (lastLesson as any).orderIndex + 1 : 0;
    }

    const lesson = await Lesson.create({
        moduleId,
        productId: courseId,
        title,
        slug: slugify(title) + '-' + Math.random().toString(36).substring(7),
        lessonType: videoUrl ? 'video' : 'text',
        content: {
            videoUrl,
            textContent: content
        },
        durationMinutes: durationMinutes || 0,
        orderIndex: lessonOrder,
        isFreePreview: false,
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

    const lessons = await Lesson.find(query).sort({ orderIndex: 1 });
    return { lessons };
}));
