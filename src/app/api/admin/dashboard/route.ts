import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Admin from '@/lib/models/Admin';
import Order from '@/lib/models/Order';
import { withAdminAuth } from '@/lib/firebase/withAuth';
import { getCurrentUser } from '@/lib/firebase/server-auth';

export async function checkAdminAccess() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // Or throw error/return unauthorized response depending on usage
  }

  if (user.role !== 'admin' && user.role !== 'super-admin') {
    return null;
  }

  return user;
}

/**
 * GET /api/admin/dashboard
 * Get overall dashboard statistics
 */
export const GET = withAdminAuth(async (request, user) => {
  try {
    // Admin check is already handled by withAdminAuth
    // user object is available directly

    await connectToDatabase();

    // Optional: Double check Admin model presence if needed, but role check is usually enough
    // const adminProfile = await Admin.findOne({ userId: user._id });

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
