import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import CourseProgress from '@/lib/models/CourseProgress';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const userId = (session.user as any).id;

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

        // 3. Fetch Progress
        let progress = await CourseProgress.findOne({ userId, productId: product._id });
        if (!progress) {
            progress = await CourseProgress.create({ userId, productId: product._id, completedLessons: [] });
        }

        return NextResponse.json({
            product,
            progress
        });

    } catch (error: any) {
        console.error('Course API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}
