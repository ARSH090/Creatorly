import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { checkAdminPermission } from '@/lib/middleware/adminAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest, user: any) {
  if (!checkAdminPermission('view_payouts', user.role)) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');

  const query: any = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [payouts, total] = await Promise.all([
    Payout.find(query)
      .populate('creatorId', 'displayName email payoutDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payout.countDocuments(query)
  ]);

  return NextResponse.json({
    payouts,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));

