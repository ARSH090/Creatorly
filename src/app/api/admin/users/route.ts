import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { recordAdminAction } from '@/lib/utils/auditLogger';

async function getHandler(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role');
  const status = searchParams.get('status');

  const query: any = {};

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }

  if (role && role !== 'all') {
    query.role = role;
  }

  if (status && status !== 'all') {
    if (status === 'suspended') query.isSuspended = true;
    if (status === 'active') query.isSuspended = false;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('displayName email username role plan subscriptionStatus isSuspended createdAt trialUsed')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return NextResponse.json({
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
}

async function patchHandler(req: NextRequest, admin: any) {
  await dbConnect();
  const body = await req.json();
  const { userId, role, subscriptionStatus, isSuspended } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const updates: any = {};
  if (role) updates.role = role;
  if (subscriptionStatus) updates.subscriptionStatus = subscriptionStatus;
  if (isSuspended !== undefined) updates.isSuspended = isSuspended;

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });

  // Record Audit Log
  await recordAdminAction({
    adminEmail: admin.email,
    action: 'UPDATE_USER',
    targetType: 'user',
    targetId: userId,
    changes: {
      before: {
        role: targetUser.role,
        subscriptionStatus: targetUser.subscriptionStatus,
        isSuspended: targetUser.isSuspended
      },
      after: updates
    },
    req
  });

  return NextResponse.json({ success: true, user: updatedUser });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
export const PATCH = withAdminAuth(withErrorHandler(patchHandler));

