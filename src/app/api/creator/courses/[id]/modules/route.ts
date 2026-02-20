import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { CourseModule as Module } from '@/lib/models/CourseContent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/creator/courses/:id/modules
 * Create a new course module
 * Body: { title, description?, order? }
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const courseId = params.id;

    const body = await req.json();
    const { title, description, order } = body;

    if (!title) {
        throw new Error('Module title is required');
    }

    const course = await Product.findOne({
        _id: courseId,
        creatorId: user._id,
        type: 'course'
    });

    if (!course) {
        throw new Error('Course not found');
    }

    // Determine order
    let moduleOrder = order;
    if (moduleOrder === undefined) {
        const lastModule = await Module.findOne({ productId: courseId }).sort({ orderIndex: -1 });
        moduleOrder = lastModule ? (lastModule as any).orderIndex + 1 : 0;
    }

    const module = await Module.create({
        productId: courseId,
        title,
        description,
        orderIndex: moduleOrder,
        isActive: true
    });

    return {
        success: true,
        module,
        message: 'Module created successfully'
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
export const GET = withCreatorAuth(withErrorHandler(async (req: NextRequest, user: any, context: any) => {
    await connectToDatabase();
    const params = await context.params;
    const courseId = params.id;

    const modules = await Module.find({ productId: courseId }).sort({ orderIndex: 1 });
    return { modules };
}));
