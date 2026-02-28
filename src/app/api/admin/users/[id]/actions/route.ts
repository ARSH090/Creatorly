import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { auditLog } from '@/lib/utils/auditLogger';

async function handler(
    req: NextRequest,
    admin: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { action, reason } = await req.json();

    if (!action) {
        return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    await connectToDatabase();

    const targetUser = await User.findById(id);
    if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let update: any = {};
    let logAction = '';

    switch (action) {
        case 'suspend':
            update = { isSuspended: true, suspensionReason: reason, suspendedAt: new Date(), suspendedBy: admin.email };
            logAction = 'suspend_user';
            break;
        case 'unsuspend':
            update = { isSuspended: false, $unset: { suspensionReason: "", suspendedAt: "", suspendedBy: "" } };
            logAction = 'unsuspend_user';
            break;
        case 'freeze_payout':
            update = { payoutStatus: 'held', payoutHoldReason: reason };
            logAction = 'freeze_payouts';
            break;
        case 'unfreeze_payout':
            update = { payoutStatus: 'enabled', $unset: { payoutHoldReason: "" } };
            logAction = 'unfreeze_payouts';
            break;
        case 'delete':
            // Soft delete
            update = { deletedAt: new Date(), status: 'suspended' };
            logAction = 'delete_user';
            break;
        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await User.findByIdAndUpdate(id, update);

    // Record in Audit Log
    await auditLog({
        userId: admin.id || admin._id,
        action: logAction,
        resourceType: 'user',
        resourceId: targetUser._id,
        metadata: { action, reason },
        req
    });

    return NextResponse.json({ success: true, action: logAction });
}

export const POST = withAdminAuth(withErrorHandler(handler));
