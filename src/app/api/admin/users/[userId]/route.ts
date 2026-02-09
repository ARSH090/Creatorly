import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { AdminLog } from '@/lib/models/AdminLog';
import { adminAuthMiddleware, checkAdminPermission } from '@/lib/middleware/adminAuth';
import { z } from 'zod';
import type { RouteContext } from '@/lib/types/route-types';

export const dynamic = 'force-dynamic';

const userUpdateSchema = z.object({
  displayName: z.string().optional(),
  role: z.enum(['user', 'creator', 'admin', 'super_admin']).optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  context: RouteContext<{ userId: string }>
): Promise<Response> {
  try {
    const { userId } = await context.params;
    const authResult = await adminAuthMiddleware(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!checkAdminPermission('view_users', authResult.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await connectToDatabase();
    const user = await User.findById(userId)
      .select('-password -refreshToken')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: RouteContext<{ userId: string }>
): Promise<Response> {
  try {
    const { userId } = await context.params;
    const authResult = await adminAuthMiddleware(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!checkAdminPermission('manage_users', authResult.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();
    const validation = userUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const previousValues = {
      displayName: user.displayName,
      role: user.role,
      status: user.status,
    };

    // Update user
    Object.assign(user, validation.data);
    await user.save();

    // Log action
    await AdminLog.create({
      adminId: authResult.user._id,
      adminEmail: authResult.user.email,
      action: 'UPDATE',
      resource: 'USER',
      resourceId: userId,
      resourceName: user.email,
      description: `Updated user ${user.email}`,
      changes: validation.data,
      previousValue: previousValues,
      newValue: validation.data,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      status: 'success',
    });

    return NextResponse.json({ message: 'User updated', user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext<{ userId: string }>
): Promise<Response> {
  try {
    const { userId } = await context.params;
    const authResult = await adminAuthMiddleware(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!checkAdminPermission('manage_users', authResult.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log action
    await AdminLog.create({
      adminId: authResult.user._id,
      adminEmail: authResult.user.email,
      action: 'DELETE',
      resource: 'USER',
      resourceId: userId,
      resourceName: user.email,
      description: `Deleted user ${user.email}`,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      status: 'success',
    });

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
