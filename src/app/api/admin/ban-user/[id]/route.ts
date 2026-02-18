import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { User } from '@/lib/models/User';
import { logAdminAction } from '@/lib/services/adminLogger';

/**
 * POST /api/admin/ban-user/:id
 * Ban a user account
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAdminAuth(async (request, adminUser) => {
        try {
            await connectToDatabase();

            const { id } = await context.params;
            const body = await req.json();
            const { reason } = body;

            if (!reason) {
                return NextResponse.json(
                    { error: 'Ban reason is required' },
                    { status: 400 }
                );
            }

            const user = await User.findById(id);
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Update user
            user.subscriptionStatus = 'banned';
            user.isFlagged = true;
            user.flagReason = reason;
            user.flaggedAt = new Date();
            await user.save();

            // Log admin action
            logAdminAction({
                adminId: adminUser.email,
                action: 'BAN_USER',
                resource: 'user',
                details: { reason, userId: id },
                timestamp: new Date()
            });

            return NextResponse.json({
                message: 'User banned successfully',
                userId: id
            });

        } catch (error: any) {
            console.error('Ban user error:', error);
            return NextResponse.json(
                { error: 'Failed to ban user', details: error.message },
                { status: 500 }
            );
        }
    })(req);
}
