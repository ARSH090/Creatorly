import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth, logAdminAction } from '@/lib/firebase/withAdminAuth';

/**
 * PUT /api/admin/users/:id
 * Update user (plan, status, role, etc.)
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const userId = params.id;

    const body = await req.json();
    const { plan, role, payoutStatus, isSuspended, suspensionReason } = body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
        );
    }

    // Track changes
    const changes: any = {};

    if (plan !== undefined && plan !== targetUser.plan) {
        changes.plan = { from: targetUser.plan, to: plan };
        targetUser.plan = plan;
    }

    if (role !== undefined && role !== targetUser.role) {
        changes.role = { from: targetUser.role, to: role };
        targetUser.role = role;
    }

    if (payoutStatus !== undefined && payoutStatus !== targetUser.payoutStatus) {
        changes.payoutStatus = { from: targetUser.payoutStatus, to: payoutStatus };
        targetUser.payoutStatus = payoutStatus;
    }

    if (isSuspended !== undefined && isSuspended !== targetUser.isSuspended) {
        changes.isSuspended = { from: targetUser.isSuspended, to: isSuspended };
        targetUser.isSuspended = isSuspended;
    }

    if (suspensionReason !== undefined) {
        targetUser.suspensionReason = suspensionReason;
    }

    await targetUser.save();

    // Log action
    await logAdminAction(
        user.email,
        'UPDATE_USER',
        'user',
        userId,
        changes,
        req
    );

    return NextResponse.json({
        success: true,
        data: { user: targetUser },
        message: 'User updated successfully'
    });
}

/**
 * DELETE /api/admin/users/:id
 * Delete user (soft delete)
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const userId = params.id;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
        );
    }

    // Soft delete - suspend and mark
    targetUser.isSuspended = true;
    targetUser.suspensionReason = 'Deleted by admin';
    await targetUser.save();

    // Log action
    await logAdminAction(
        user.email,
        'DELETE_USER',
        'user',
        userId,
        { email: targetUser.email },
        req
    );


    return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
    });
}

export const PUT = withAdminAuth(putHandler);
export const DELETE = withAdminAuth(deleteHandler);
