import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const order = await Order.findById(id)
        .populate('creatorId', 'displayName email')
        .populate('userId', 'displayName email')
        .populate('productId', 'name price')
        .lean();

    if (!order) {
        return new NextResponse('Order not found', { status: 404 });
    }

    return NextResponse.json({ order });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
