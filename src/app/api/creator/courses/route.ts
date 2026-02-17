import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/courses
 * List all courses (products of type 'course')
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const courses = await Product.find({
        creatorId: user._id,
        type: 'course'
    }).sort({ createdAt: -1 });

    const coursesWithStats = courses.map(course => ({
        _id: course._id,
        name: course.name,
        description: course.description,
        price: course.price,
        thumbnail: course.thumbnail,
        lessonCount: course.curriculum?.length || 0,
        status: course.status,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
    }));

    return { courses: coursesWithStats };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
