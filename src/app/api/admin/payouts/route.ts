import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import { withAdminAuth } from '@/lib/firebase/withAdminAuth';

/**
 * GET /api/admin/payouts
 * List all payouts with filters
 */
async function handler(req: NextRequest, user: any, context: any) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status'); // pending, approved, paid, rejected

  // Build query
  const query: any = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [payouts, total] = await Promise.all([
    Payout.find(query)
      .populate('creatorId', 'displayName email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payout.countDocuments(query)
  ]);

  // Calculate summary
  const summary = payouts.reduce((acc: any, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    acc.totalAmount += p.amount;
    return acc;
  }, { pending: 0, approved: 0, processed: 0, paid: 0, failed: 0, rejected: 0, totalAmount: 0 });

  return NextResponse.json({
    success: true,
    data: {
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary
    }
  });
}

export const GET = withAdminAuth(handler);
