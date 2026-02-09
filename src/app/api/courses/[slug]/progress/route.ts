import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import CourseProgress from '@/lib/models/CourseProgress';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lessonId } = await req.json();
        await connectToDatabase();
        const userId = (session.user as any).id;

        const { slug } = await context.params;
        const product = await Product.findOne({ slug });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

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
}
