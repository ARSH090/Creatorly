import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { AdminLog } from '@/lib/models/AdminLog';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import Payout from '@/lib/models/Payout';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const targetUser = await User.findById(id).lean();
    if (!targetUser) {
        return new NextResponse('User not found', { status: 404 });
    }

    // Fetch related stats
    const [products, orders, payouts] = await Promise.all([
        Product.find({ userId: id }).select('title price status').lean(),
        Order.find({ creatorId: id }).select('total status createdAt').limit(10).sort({ createdAt: -1 }).lean(),
        Payout.find({ userId: id }).select('amount status createdAt').limit(10).sort({ createdAt: -1 }).lean()
    ]);

    return NextResponse.json({
        user: targetUser,
        products,
        orders,
        payouts
    });
}

async function putHandler(
    req: NextRequest,
    admin: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();
    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) return new NextResponse('User not found', { status: 404 });

    // Update allowed fields
    if (body.displayName) targetUser.displayName = body.displayName;
    if (body.email) targetUser.email = body.email;
    if (body.plan) targetUser.plan = body.plan;
    if (body.role) targetUser.role = body.role;

    await targetUser.save();

    // Log action
    await AdminLog.create({
        adminEmail: admin.email,
        action: 'update_user',
        targetType: 'user',
        targetId: targetUser._id,
        changes: body,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent')
    });

    return NextResponse.json(targetUser);
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
export const PUT = withAdminAuth(withErrorHandler(putHandler));
