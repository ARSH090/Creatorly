import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Coupon } from '@/lib/models/Coupon';
import { AdminLog } from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function deleteHandler(
    req: NextRequest,
    admin: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return new NextResponse('Coupon not found', { status: 404 });

    await AdminLog.create({
        adminEmail: admin.email,
        action: 'delete_coupon',
        targetType: 'coupon',
        targetId: coupon._id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ message: 'Coupon deleted' });
}

async function putHandler(
    req: NextRequest,
    admin: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();
    await dbConnect();

    const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true });
    if (!coupon) return new NextResponse('Coupon not found', { status: 404 });

    await AdminLog.create({
        adminEmail: admin.email,
        action: 'update_coupon',
        targetType: 'coupon',
        targetId: coupon._id,
        changes: body,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(coupon);
}

export const DELETE = withAdminAuth(withErrorHandler(deleteHandler));
export const PUT = withAdminAuth(withErrorHandler(putHandler));
