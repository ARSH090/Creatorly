import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * PUT /api/creator/courses/lessons/:id
 * Update lesson
 * Body: { courseId, title?, description?, videoUrl?, content?, order? }
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const lessonId = params.id;

    const body = await req.json();
    const { courseId, title, description, videoUrl, content, order } = body;

    if (!courseId) {
        throw new Error('courseId is required');
    }

    const course = await Product.findOne({
        _id: courseId,
        creatorId: user._id,
        type: 'course'
    });

    if (!course || !course.curriculum) {
        throw new Error('Course not found');
    }

    // Find and update lesson
    const lessonIndex = course.curriculum.findIndex((l: any) => l._id.toString() === lessonId);

    if (lessonIndex === -1) {
        throw new Error('Lesson not found');
    }

    if (title) course.curriculum[lessonIndex].title = title;
    if (description !== undefined) course.curriculum[lessonIndex].description = description;
    if (videoUrl !== undefined) course.curriculum[lessonIndex].videoUrl = videoUrl;
    if (content !== undefined) course.curriculum[lessonIndex].content = content;
    if (order !== undefined) course.curriculum[lessonIndex].order = order;

    await course.save();

    return {
        success: true,
        lesson: course.curriculum[lessonIndex],
        message: 'Lesson updated successfully'
    };
}

/**
 * DELETE /api/creator/courses/lessons/:id
 * Delete lesson
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const lessonId = params.id;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
        throw new Error('courseId query parameter is required');
    }

    const course = await Product.findOne({
        _id: courseId,
        creatorId: user._id,
        type: 'course'
    });

    if (!course || !course.curriculum) {
        throw new Error('Course not found');
    }

    // Remove lesson
    const initialLength = course.curriculum.length;
    course.curriculum = course.curriculum.filter((l: any) => l._id.toString() !== lessonId);

    if (course.curriculum.length === initialLength) {
        throw new Error('Lesson not found');
    }

    await course.save();

    return {
        success: true,
        message: 'Lesson deleted successfully'
    };
}

export const PUT = withCreatorAuth(withErrorHandler(putHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
