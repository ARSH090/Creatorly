import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Coupon } from '@/lib/models/Coupon';
import { AdminLog } from '@/lib/models/AdminLog';

export async function DELETE(
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

        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return new NextResponse('Coupon not found', { status: 404 });

        await AdminLog.create({
            adminEmail: session.user.email,
            action: 'delete_coupon',
            targetType: 'coupon',
            targetId: coupon._id,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ message: 'Coupon deleted' });

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

        const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true });
        if (!coupon) return new NextResponse('Coupon not found', { status: 404 });

        await AdminLog.create({
            adminEmail: session.user.email,
            action: 'update_coupon',
            targetType: 'coupon',
            targetId: coupon._id,
            changes: body,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json(coupon);

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
