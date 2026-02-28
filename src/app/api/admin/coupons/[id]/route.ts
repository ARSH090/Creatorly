import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Coupon } from '@/lib/models/Coupon';
import { auditLog } from '@/lib/utils/auditLogger';
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

    await auditLog({
        userId: admin.id || admin._id,
        action: 'delete_coupon',
        resourceType: 'coupon',
        resourceId: coupon._id,
        req
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

    await auditLog({
        userId: admin.id || admin._id,
        action: 'update_coupon',
        resourceType: 'coupon',
        resourceId: coupon._id,
        metadata: body,
        req
    });

    return NextResponse.json(coupon);
}

export const DELETE = withAdminAuth(withErrorHandler(deleteHandler));
export const PUT = withAdminAuth(withErrorHandler(putHandler));
