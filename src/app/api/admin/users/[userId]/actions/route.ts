import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/firebase/server-auth';
import { recordSecurityEvent, SecurityEventType } from '@/lib/security/monitoring';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await connectToDatabase();
        const { userId } = await params;
        const { action, reason } = await req.json();

        // 1. Verify Admin Permissions
        const adminUser = await getCurrentUser();
        if (!adminUser || !['admin', 'super-admin'].includes(adminUser.role || '')) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        // 2. Fetch Target User
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Process Action
        let update: any = {};
        let statusText = '';

        switch (action) {
            case 'freeze':
                update = {
                    status: 'suspended',
                    isSuspended: true,
                    suspensionReason: reason,
                    suspendedAt: new Date(),
                    suspendedBy: adminUser.displayName
                };
                statusText = 'suspended';
                break;

            case 'unfreeze':
                update = {
                    status: 'active',
                    isSuspended: false,
                    suspensionReason: '',
                    suspendedAt: null,
                    suspendedBy: ''
                };
                statusText = 'active';
                break;

            case 'block_payouts':
                update = {
                    payoutStatus: 'held',
                    payoutHoldReason: reason
                };
                statusText = 'payout_hold';
                break;

            case 'enable_payouts':
                update = {
                    payoutStatus: 'enabled',
                    payoutHoldReason: ''
                };
                statusText = 'payout_enabled';
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 4. Update History
        const historyEntry = {
            status: statusText,
            reason: reason || 'Admin action',
            date: new Date(),
            adminId: adminUser.id
        };

        await User.findByIdAndUpdate(userId, {
            $set: update,
            $push: { suspensionHistory: historyEntry }
        });

        // 5. Audit Log
        await recordSecurityEvent(
            SecurityEventType.ADMIN_ACTION,
            {
                action,
                targetUserId: userId,
                targetUsername: targetUser.username,
                reason,
                performedBy: adminUser.displayName
            },
            req.headers.get('x-forwarded-for') || 'unknown',
            adminUser.id
        );

        return NextResponse.json({
            success: true,
            message: `User ${targetUser.username} updated: ${action}`
        });

    } catch (error: any) {
        console.error('Admin Action Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
