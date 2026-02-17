import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import CourseProgress from '@/lib/models/CourseProgress';
import { withAuth } from '@/lib/auth/withAuth';

export const POST = withAuth(async (req, user, context: any) => {
    try {
        const { lessonId } = await req.json();
        await connectToDatabase();
        const userId = user._id;

        const { slug } = await context.params;
        const product = await Product.findOne({ slug });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // --- Entitlement Verification ---
        const [order, subscription] = await Promise.all([
            import('@/lib/models/Order').then(m => m.default.findOne({
                userId, // Note: Order model might use customerEmail or userId. 
                productId: product._id,
                status: 'success'
            })),
            import('@/lib/models/Subscription').then(m => m.default.findOne({
                userId,
                productId: product._id,
                status: 'active'
            }))
        ]);

        if (!order && !subscription) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'You have not purchased this course or your subscription has expired.'
            }, { status: 403 });
        }
        // ------------------------------

        // Update progress - add lessonId to completedLessons if not already present
        const progress = await CourseProgress.findOneAndUpdate(
            { userId, productId: product._id },
            {
                $addToSet: { completedLessons: lessonId },
                $set: { lastAccessedAt: new Date() }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, progress });

    } catch (error: any) {
        console.error('Progress API Error:', error);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
});
