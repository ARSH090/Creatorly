import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Review from '@/lib/models/Review';
import Order from '@/lib/models/Order';
import { getMongoUser } from '@/lib/auth/get-user';

// GET /api/reviews/[productId] - Public
export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    await connectToDatabase();
    const { productId } = await params;

    try {
        const reviews = await Review.find({ productId, isApproved: true })
            .populate('userId', 'displayName avatar')
            .sort({ createdAt: -1 });

        return NextResponse.json({ reviews });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

// POST /api/reviews/[productId] - Authenticated & Buyer Only
export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    await connectToDatabase();
    const { productId } = await params;
    const user = await getMongoUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, comment } = await req.json();

    if (!rating || !comment) {
        return NextResponse.json({ error: 'Rating and comment required' }, { status: 400 });
    }

    // Verify purchase
    const hasPurchased = await Order.exists({
        userId: user._id,
        'items.productId': productId,
        status: 'success'
    });

    if (!hasPurchased) {
        // Allow review if user is the creator (for testing?) -> No, only buyers.
        // Or if it's a free product/subscription?
        // For strictly "verified purchase" reviews:
        return NextResponse.json({ error: 'Only verified buyers can review this product' }, { status: 403 });
    }

    try {
        const review = await Review.create({
            productId,
            userId: user._id,
            rating,
            comment,
            isApproved: true // Auto-approve
        });

        return NextResponse.json({ review });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
}
