import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Payout } from '@/lib/models/Payout';
import { withAdminAuth } from '@/lib/firebase/withAdminAuth';

/**
 * GET /api/admin/payouts
 * List all payouts with filters
 */
async function handler(req: NextRequest, user: any) {
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
  const summary = await Payout.aggregate([
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summaryMap = summary.reduce((acc, s) => {
    acc[s._id] = {
      amount: Math.round(s.totalAmount * 100) / 100,
      count: s.count
    };
    return acc;
  }, {} as Record<string, any>);

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
      summary: summaryMap
    }
  });
}

export const GET = withAdminAuth(handler);
