import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { AdminLog } from '@/lib/models/AdminLog';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { Payout } from '@/lib/models/Payout';

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

        const user = await User.findById(id).lean();
        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        // Fetch related stats
        const [products, orders, payouts] = await Promise.all([
            Product.find({ userId: id }).select('title price status').lean(),
            Order.find({ creatorId: id }).select('total status createdAt').limit(10).sort({ createdAt: -1 }).lean(),
            Payout.find({ userId: id }).select('amount status createdAt').limit(10).sort({ createdAt: -1 }).lean()
        ]);

        return NextResponse.json({
            user,
            products,
            orders,
            payouts
        });

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        await dbConnect();

        const user = await User.findById(id);
        if (!user) return new NextResponse('User not found', { status: 404 });

        // Update allowed fields
        if (body.displayName) user.displayName = body.displayName;
        if (body.email) user.email = body.email;
        if (body.plan) user.plan = body.plan;
        if (body.role) user.role = body.role;

        await user.save();

        // Log action
        await AdminLog.create({
            adminEmail: session.user.email,
            action: 'update_user',
            targetType: 'user',
            targetId: user._id,
            changes: body,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent')
        });

        return NextResponse.json(user);

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
