import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Admin from '@/lib/models/Admin';
import Order from '@/lib/models/Order';

async function checkAdminAccess(session: any) {
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();
  const admin = await Admin.findOne({ userId: session.user.id });

  if (!admin) {
    throw new Error('Not an admin');
  }

  return admin;
}

/**
 * GET /api/admin/dashboard
 * Get overall dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const admin = await checkAdminAccess(session);

    await connectToDatabase();

    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const recentOrders = await Order.find()
      .populate('productId')
      .populate('creatorId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(10);

    const topCreators = await Order.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$creatorId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'creator' } },
    ]);

    return NextResponse.json({
      statistics: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        avgOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0,
      },
      recentOrders,
      topCreators,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Access denied' },
      { status: error instanceof Error && error.message === 'Not an admin' ? 403 : 401 }
    );
  }
}
