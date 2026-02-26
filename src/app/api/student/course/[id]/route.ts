import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withAuth } from '@/lib/auth/withAuth';
import { Order } from '@/lib/models/Order';
import CourseProgress from '@/lib/models/CourseProgress';
import Product from '@/lib/models/Product';
import { errorResponse } from '@/types/api';

/**
 * GET /api/student/course/:id
 * Fetch course content and current progress for a student
 */
async function getHandler(req: NextRequest, user: any, { params }: any) {
    await connectToDatabase();
    const { id } = await params;

    // 1. Verify Ownership
    const order = await Order.findOne({
        userId: user._id,
        "items.productId": id,
        paymentStatus: 'paid'
    });

    if (!order) {
        return NextResponse.json(errorResponse('You do not have access to this course'), { status: 403 });
    }

    // 2. Fetch Course Structure (Product)
    const course = await Product.findById(id);
    if (!course || course.productType !== 'course') {
        return NextResponse.json(errorResponse('Course not found'), { status: 404 });
    }

    // 3. Fetch/Initialize Progress
    let progress = await CourseProgress.findOne({
        userId: user._id,
        productId: id
    });

    if (!progress) {
        progress = await CourseProgress.create({
            userId: user._id,
            productId: id,
            completedLessons: [],
            percentComplete: 0
        });
    }

    return NextResponse.json({
        success: true,
        course: {
            id: course._id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnailKey,
            sections: course.sections,
            creatorId: course.creatorId
        },
        progress: {
            completedLessons: progress.completedLessons,
            percentComplete: progress.percentComplete,
            lastAccessedAt: progress.lastAccessedAt
        }
    });
}

/**
 * POST /api/student/course/:id/progress
 * Update lesson completion status
 */
async function postHandler(req: NextRequest, user: any, { params }: any) {
    await connectToDatabase();
    const { id } = await params;
    const { lessonId, completed } = await req.json();

    if (!lessonId) return NextResponse.json(errorResponse('Lesson ID is required'), { status: 400 });

    const progress = await CourseProgress.findOne({
        userId: user._id,
        productId: id
    });

    if (!progress) return NextResponse.json(errorResponse('Progress record not found'), { status: 404 });

    // Update completed lessons
    if (completed) {
        if (!progress.completedLessons.includes(lessonId)) {
            progress.completedLessons.push(lessonId);
        }
    } else {
        progress.completedLessons = progress.completedLessons.filter(l => l !== lessonId);
    }

    // Calculate percent complete (requires fetching course structure again)
    const course = await Product.findById(id);
    if (course && course.sections) {
        let totalLessons = 0;
        course.sections.forEach((s: any) => totalLessons += s.lessons.length);

        if (totalLessons > 0) {
            progress.percentComplete = Math.round((progress.completedLessons.length / totalLessons) * 100);
            progress.isCompleted = progress.percentComplete === 100;
        }
    }

    progress.lastAccessedAt = new Date();
    await progress.save();

    return NextResponse.json({
        success: true,
        progress: {
            completedLessons: progress.completedLessons,
            percentComplete: progress.percentComplete,
            isCompleted: progress.isCompleted
        }
    });
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
