import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { auditLog } from '@/lib/utils/auditLogger';
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
        // BUG-34 FIX: Products are keyed by creatorId, not userId
        Product.find({ creatorId: id }).select('name price status').lean(),
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

    // BUG-33 FIX: Only super-admins can assign super-admin role
    if (body.role) {
        const adminRole = (admin as any).role;
        if (body.role === 'super-admin' && adminRole !== 'super-admin') {
            return NextResponse.json({ error: 'Forbidden: Only super-admins can assign super-admin role' }, { status: 403 });
        }
        targetUser.role = body.role;
    }

    await targetUser.save();

    // Log action
    await auditLog({
        userId: admin.id || admin._id,
        action: 'update_user',
        resourceType: 'user',
        resourceId: targetUser._id,
        metadata: body,
        req
    });

    return NextResponse.json(targetUser);
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
export const PUT = withAdminAuth(withErrorHandler(putHandler));
