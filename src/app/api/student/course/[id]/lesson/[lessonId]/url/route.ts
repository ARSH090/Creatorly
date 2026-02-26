import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withAuth } from '@/lib/auth/withAuth';
import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { getPresignedDownloadUrl } from '@/lib/storage/s3';
import { errorResponse } from '@/types/api';

/**
 * GET /api/student/course/:id/lesson/:lessonId/url
 * Generate a secure, time-limited download/stream URL for a lesson file
 */
async function getHandler(req: NextRequest, user: any, { params }: any) {
    await connectToDatabase();
    const { id, lessonId } = await params;

    // 1. Verify Ownership
    const order = await Order.findOne({
        userId: user._id,
        "items.productId": id,
        paymentStatus: 'paid'
    });

    if (!order) {
        return NextResponse.json(errorResponse('No access to this course'), { status: 403 });
    }

    // 2. Fetch Course & Find Lesson
    const course = await Product.findById(id);
    if (!course) return NextResponse.json(errorResponse('Course not found'), { status: 404 });

    let lessonFileKey = null;
    course.sections?.forEach((s: any) => {
        const lesson = s.lessons.find((l: any) => l._id.toString() === lessonId);
        if (lesson) lessonFileKey = lesson.fileKey;
    });

    if (!lessonFileKey) {
        return NextResponse.json(errorResponse('Lesson content not found'), { status: 404 });
    }

    // 3. Generate Presigned URL
    try {
        const url = await getPresignedDownloadUrl(lessonFileKey, 14400); // 4 hours for streaming
        return NextResponse.json({ success: true, url });
    } catch (error) {
        return NextResponse.json(errorResponse('Failed to generate secure link'), { status: 500 });
    }
}

export const GET = withAuth(getHandler);
