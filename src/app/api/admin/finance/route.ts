import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import { AdminLog } from '@/lib/models/AdminLog';
import Payout from '@/lib/models/Payout';
import User from '@/lib/models/User';
import { adminAuthMiddleware, checkAdminPermission } from '@/lib/middleware/adminAuth';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminAuthMiddleware(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!checkAdminPermission('view_finance', auth.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await connectToDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Platform Revenue
    const monthlyMetrics = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          grossRevenue: { $sum: '$total' },
          platformCommission: { $sum: { $multiply: ['$total', 0.05] } },
          creatorEarnings: { $sum: { $multiply: ['$total', 0.95] } },
          refunded: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, '$total', 0] } },
        },
      },
    ]);

    // Yearly metrics
    const yearlyMetrics = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfYear }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          grossRevenue: { $sum: '$total' },
          platformCommission: { $sum: { $multiply: ['$total', 0.05] } },
          creatorEarnings: { $sum: { $multiply: ['$total', 0.95] } },
        },
      },
    ]);

    // Payout statistics
    const payoutStats = await Payout.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]);

    // Pending payouts
    const pendingPayouts = await Payout.find({ status: 'pending' })
      .populate('creatorId', 'displayName email')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      metrics: {
        monthly: monthlyMetrics[0] || {
          orders: 0,
          grossRevenue: 0,
          platformCommission: 0,
          creatorEarnings: 0,
          refunded: 0,
        },
        yearly: yearlyMetrics[0] || {
          orders: 0,
          grossRevenue: 0,
          platformCommission: 0,
          creatorEarnings: 0,
        },
        payouts: payoutStats.reduce(
          (acc: any, stat: any) => {
            acc[stat._id] = { count: stat.count, amount: stat.amount };
            return acc;
          },
          {}
        ),
      },
      pendingPayouts,
    });
  } catch (error) {
    console.error('Finance metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance metrics' },
      { status: 500 }
    );
  }
}
