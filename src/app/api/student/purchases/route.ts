import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withAuth } from '@/lib/auth/withAuth';
import { Order } from '@/lib/models/Order';
import CourseProgress from '@/lib/models/CourseProgress';
import Product from '@/lib/models/Product';

/**
 * GET /api/student/purchases
 * Fetch all digital products and courses purchased by the user
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    // 1. Fetch completed orders for this user
    const orders = await Order.find({
        userId: user._id,
        paymentStatus: 'paid'
    })
        .populate('items.productId')
        .sort({ createdAt: -1 });

    // 2. Fetch course progress for these items
    const productIds = orders.flatMap(order => order.items.map(i => i.productId));
    const progressRecords = await CourseProgress.find({
        userId: user._id,
        productId: { $in: productIds }
    });

    // 3. Transform data for the dashboard
    const purchases = orders.flatMap(order =>
        order.items.map(item => {
            const product: any = item.productId;
            if (!product) return null;

            const progress = progressRecords.find(p => p.productId.toString() === product._id.toString());

            return {
                id: product._id,
                title: product.title,
                thumbnail: product.thumbnailKey,
                type: product.productType,
                purchasedAt: order.createdAt,
                amount: item.price,
                orderId: order._id,
                progress: progress ? {
                    percent: progress.percentComplete,
                    completedLessons: progress.completedLessons.length,
                    isCompleted: progress.isCompleted
                } : null,
                // Include first few section titles for preview?
                preview: product.sections?.slice(0, 1).map((s: any) => s.title)
            };
        })
    ).filter(p => p !== null);

    return NextResponse.json({
        success: true,
        purchases
    });
}

export const GET = withAuth(getHandler);
