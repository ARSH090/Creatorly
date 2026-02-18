import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import CourseProgress from '@/lib/models/CourseProgress';
import { withAuth } from '@/lib/auth/withAuth';

export const GET = withAuth(async (req, user, context: any) => {
    try {
        await connectToDatabase();
        const userId = user._id;

        const { slug } = await context.params;
        const product = await Product.findOne({ slug, type: 'course' });
        if (!product) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // 2. Check Access (Order status must be 'success')
        // We check if the user has an order for this product
        const hasAccess = await Order.findOne({
            userId,
            productId: product._id,
            status: 'success'
        });

        if (!hasAccess && !product.isFeatured) { // Mock bypass or specific logic if needed
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // 3. Fetch Curriculum (Modules & Lessons)
        const [modules, lessons] = await Promise.all([
            import('@/lib/models/CourseContent').then(m => m.Module.find({ productId: product._id }).sort({ order: 1 })),
            import('@/lib/models/CourseContent').then(m => m.Lesson.find({ productId: product._id }).sort({ order: 1 }))
        ]);

        // Construct hierarchical curriculum
        const curriculum = modules.map(mod => ({
            id: mod._id.toString(),
            title: mod.title,
            description: mod.description,
            order: mod.order,
            lessons: lessons
                .filter(l => l.moduleId.toString() === mod._id.toString())
                .map(l => ({
                    id: l._id.toString(),
                    title: l.title,
                    type: l.videoUrl ? 'video' : 'text',
                    content: l.content || l.videoUrl,
                    duration: l.durationMinutes ? `${l.durationMinutes}:00` : '0:00',
                    isFreePreview: l.isPreview
                }))
        }));

        // If no modules found, check if there's an embedded curriculum (legacy)
        const finalCurriculum = curriculum.length > 0 ? curriculum : (product as any).curriculum || [];

        // 4. Fetch Progress
        let progress = await CourseProgress.findOne({ userId, productId: product._id });
        if (!progress) {
            progress = await CourseProgress.create({ userId, productId: product._id, completedLessons: [] });
        }

        return NextResponse.json({
            product: {
                ...product.toObject(),
                curriculum: finalCurriculum
            },
            progress
        });

    } catch (error: any) {
        console.error('Course API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
});
