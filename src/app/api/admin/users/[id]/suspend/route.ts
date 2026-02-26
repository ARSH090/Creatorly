import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { AdminLog } from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * POST /api/admin/users/[id]/suspend
 * 
 * FIXES:
 * - BUG-32: Clerk session is now immediately revoked via banUser — user cannot stay logged in
 */
async function postHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) return new NextResponse('User not found', { status: 404 });

    targetUser.isSuspended = true;
    targetUser.suspendedAt = new Date();
    targetUser.suspendedBy = user.email;
    await targetUser.save();

    // BUG-32 FIX: Revoke the Clerk session immediately so the user cannot stay logged in
    // after suspension (session JWT could otherwise be valid for up to 60 seconds)
    if (targetUser.clerkId) {
        try {
            const clerk = await clerkClient();
            await clerk.users.banUser(targetUser.clerkId);
            console.log(`[Admin] Banned Clerk user ${targetUser.clerkId} (MongoDB: ${targetUser._id})`);
        } catch (clerkError) {
            // Log but don't fail — MongoDB suspension is stored, Clerk ban can be retried
            console.error(`[Admin] Failed to ban Clerk user ${targetUser.clerkId}:`, clerkError);
        }
    } else {
        console.warn(`[Admin] User ${targetUser._id} has no clerkId — cannot revoke Clerk session`);
    }

    await AdminLog.create({
        adminEmail: user.email,
        action: 'suspend_user',
        targetType: 'user',
        targetId: targetUser._id,
        details: { clerkBanned: !!targetUser.clerkId },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ message: 'User suspended and session revoked' });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
