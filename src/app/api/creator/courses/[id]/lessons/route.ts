import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/creator/courses/:id/lessons
 * Add lesson to course
 * Body: { title, description, videoUrl?, content?, order? }
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const courseId = params.id;

    const body = await req.json();
    const { title, description, videoUrl, content, order } = body;

    if (!title) {
        throw new Error('Lesson title is required');
    }

    const course = await Product.findOne({
        _id: courseId,
        creatorId: user._id,
        type: 'course'
    });

    if (!course) {
        throw new Error('Course not found');
    }

    // Initialize curriculum if doesn't exist
    if (!course.curriculum) {
        course.curriculum = [];
    }

    // Determine lesson order
    const lessonOrder = order !== undefined ? order : course.curriculum.length;

    // Add lesson
    const lesson = {
        title,
        description,
        videoUrl,
        content,
        order: lessonOrder,
        duration: 0,
        isPublished: false
    };

    course.curriculum.push(lesson);
    await course.save();

    return {
        success: true,
        lesson,
        message: 'Lesson added successfully'
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
