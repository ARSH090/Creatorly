import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { recordAdminAction } from '@/lib/utils/auditLogger';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function postHandler(req: NextRequest, user: any) {
    const { userIds, action } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
        return new NextResponse('No users selected', { status: 400 });
    }

    await dbConnect();

    let result;
    if (action === 'suspend') {
        result = await User.updateMany(
            { _id: { $in: userIds } },
            { $set: { isSuspended: true, suspendedAt: new Date(), suspendedBy: user.email } }
        );
    } else if (action === 'unsuspend') {
        result = await User.updateMany(
            { _id: { $in: userIds } },
            { $set: { isSuspended: false }, $unset: { suspendedAt: "", suspendedBy: "" } }
        );
    } else if (action === 'delete') {
        // Soft delete
        result = await User.updateMany(
            { _id: { $in: userIds } },
            { $set: { deletedAt: new Date(), status: 'suspended' }, $unset: { clerkId: "" } }
        );
    } else {
        return new NextResponse('Invalid action', { status: 400 });
    }

    // Log the bulk action using consolidated utility
    await recordAdminAction({
        adminEmail: user.email,
        action: `bulk_${action}`,
        targetType: 'system',
        targetId: 'multiple',
        changes: {
            userIds,
            modifiedCount: result.modifiedCount,
            action
        },
        req
    });

    return NextResponse.json({
        success: true,
        message: `Bulk ${action} completed`,
        modifiedCount: result.modifiedCount
    });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
