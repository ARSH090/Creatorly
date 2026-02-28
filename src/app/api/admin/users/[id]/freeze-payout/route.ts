import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { auditLog } from '@/lib/utils/auditLogger';

async function postHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) return new NextResponse('User not found', { status: 404 });

    targetUser.payoutStatus = 'held';
    targetUser.payoutHoldReason = 'Admin frozen';
    await targetUser.save();

    await auditLog({
        userId: user.id,
        action: 'freeze_user_payout',
        resourceType: 'user',
        resourceId: targetUser._id,
        req
    });

    return NextResponse.json({ message: 'Payouts frozen' });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
