import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { User } from '@/lib/models/User';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

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

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
