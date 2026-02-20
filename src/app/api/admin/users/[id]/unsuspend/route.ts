import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { AdminLog } from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function postHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) return new NextResponse('User not found', { status: 404 });

    targetUser.isSuspended = false;
    targetUser.suspendedAt = undefined;
    targetUser.suspendedBy = undefined;
    await targetUser.save();

    await AdminLog.create({
        adminEmail: user.email,
        action: 'unsuspend_user',
        targetType: 'user',
        targetId: targetUser._id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ message: 'User unsuspended' });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
