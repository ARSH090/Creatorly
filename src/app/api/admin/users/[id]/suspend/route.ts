import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { AdminLog } from '@/lib/models/AdminLog';

export async function POST(
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

        const user = await User.findById(id);
        if (!user) return new NextResponse('User not found', { status: 404 });

        user.isSuspended = true;
        user.suspendedAt = new Date();
        user.suspendedBy = session.user.email;
        await user.save();

        await AdminLog.create({
            adminEmail: session.user.email,
            action: 'suspend_user',
            targetType: 'user',
            targetId: user._id,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ message: 'User suspended' });

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
