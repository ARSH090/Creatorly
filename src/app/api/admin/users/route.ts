import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { z } from 'zod';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getAdminSession, logAdminAction, getClientIp, getClientUserAgent, ADMIN_PERMISSIONS, hasPermission } from '@/lib/admin/authMiddleware';

const getUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['user', 'creator', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'email', 'displayName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const updateUserSchema = z.object({
  displayName: z.string().optional(),
  isSuspended: z.boolean().optional(),
  suspensionReason: z.string().optional(),
  role: z.enum(['user', 'creator', 'admin']).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.VIEW_USERS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const validation = getUsersSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { search, role, status, page, limit, sortBy, sortOrder } = validation.data;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === 'suspended') {
      query.isSuspended = true;
    } else if (status === 'active') {
      query.isSuspended = false;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password -twoFactorSecret -twoFactorBackupCodes')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.EDIT_USERS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, ...updateData } = body;

    const validation = updateUserSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const clientIp = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    // Track what changed
    const changes: any = {};
    const update = validation.data;

    if (update.displayName && update.displayName !== user.displayName) {
      changes.displayName = { old: user.displayName, new: update.displayName };
      user.displayName = update.displayName;
    }

    if (update.role && update.role !== user.role) {
      changes.role = { old: user.role, new: update.role };
      user.role = update.role;
    }

    if (typeof update.isSuspended === 'boolean' && update.isSuspended !== user.isSuspended) {
      changes.isSuspended = { old: user.isSuspended, new: update.isSuspended };
      user.isSuspended = update.isSuspended;

      if (update.isSuspended) {
        user.suspendedAt = new Date();
        user.suspendedBy = session.id;
        user.suspensionReason = update.suspensionReason;
        changes.suspensionReason = update.suspensionReason;
      } else {
        user.suspendedAt = undefined;
        user.suspensionReason = undefined;
      }
    }

    if (update.permissions) {
      changes.permissions = { old: user.permissions, new: update.permissions };
      user.permissions = update.permissions;
    }

    await user.save();

    // Log the action
    await logAdminAction(
      session.id,
      session.email,
      'UPDATE',
      'USER',
      userId,
      user.email,
      `Updated user: ${JSON.stringify(Object.keys(changes))}`,
      changes,
      clientIp,
      userAgent
    );

    return NextResponse.json({
      message: 'User updated successfully',
      data: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// Impersonate user endpoint (super-admins only)
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await req.json();

    if (action === 'impersonate') {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const clientIp = getClientIp(req);

      await logAdminAction(
        session.id,
        session.email,
        'VIEW',
        'USER',
        userId,
        user.email,
        `Admin impersonated user`,
        { action: 'impersonate' },
        clientIp
      );

      return NextResponse.json({
        message: 'Impersonation started',
        sessionToken: Buffer.from(
          JSON.stringify({
            id: user._id,
            email: user.email,
            role: user.role,
            impersonatedBy: session.id,
            iat: Date.now(),
          })
        ).toString('base64'),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('User action error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
