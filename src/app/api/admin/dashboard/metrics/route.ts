import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import Subscription from '@/lib/models/Subscription';
import { withAdminAuth } from '@/lib/firebase/withAuth';
import { checkAdminPermission } from '@/lib/middleware/adminAuth';

export const GET = withAdminAuth(async (req, user, context) => {
  try {
    if (!checkAdminPermission('view_dashboard', user.role)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Get metrics
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalCreators,
      totalProducts,
      todayOrders,
      weekOrders,
      monthOrders,
      totalRevenue,
      pendingPayouts,
      activeSubscriptions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'creator' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: { payoutStatus: 'pending' },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$creatorEarnings' },
          },
        },
      ]),
      Subscription.countDocuments({ status: 'active' }),
    ]);

    // Revenue calculations
    const todayRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const weekRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const monthRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    // Top creators
    const topCreators = await Order.aggregate([
      {
        $group: {
          _id: '$creatorId',
          revenue: { $sum: '$creatorEarnings' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'creator',
        },
      },
      {
        $project: {
          creatorId: '$_id',
          displayName: { $arrayElemAt: ['$creator.displayName', 0] },
          email: { $arrayElemAt: ['$creator.email', 0] },
          revenue: 1,
          orders: 1,
        },
      },
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('creatorId', 'displayName email')
      .populate('userId', 'email displayName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Conversion rate
    const uniqueVisitors = await User.countDocuments();
    const purchasingUsers = await Order.distinct('userId');
    const conversionRate =
      uniqueVisitors > 0
        ? ((purchasingUsers.length / uniqueVisitors) * 100).toFixed(2)
        : '0.00';

    // Average order value
    const avgOrderValue =
      monthOrders > 0
        ? (
          (monthRevenue[0]?.total || 0) / monthOrders
        ).toFixed(2)
        : '0.00';

    return NextResponse.json({
      metrics: {
        users: {
          total: totalUsers,
          creators: totalCreators,
          regular: totalUsers - totalCreators,
        },
        products: {
          active: totalProducts,
        },
        orders: {
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
        },
        revenue: {
          today: todayRevenue[0]?.total || 0,
          week: weekRevenue[0]?.total || 0,
          month: monthRevenue[0]?.total || 0,
          allTime: totalRevenue[0]?.total || 0,
          platformCommission:
            (totalRevenue[0]?.total || 0) * 0.05, // 5% platform fee
        },
        payouts: {
          pending: pendingPayouts[0]?.total || 0,
        },
        subscriptions: {
          active: activeSubscriptions,
        },
        conversion: {
          rate: parseFloat(conversionRate),
          purchasingUsers: purchasingUsers.length,
        },
        averageOrderValue: parseFloat(avgOrderValue as string),
      },
      topCreators,
      recentOrders: recentOrders.map((order: any) => ({
        id: order._id,
        orderId: order.orderId,
        creator: order.creatorId?.displayName,
        customer: order.userId?.displayName,
        amount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
});
