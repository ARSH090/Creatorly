import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import Product from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';
import { withAdminAuth } from '@/lib/firebase/withAuth';
import { logAdminAction } from '@/lib/admin/logger';

/**
 * GET /api/admin/users
 * List all users with filters and pagination
 */
async function handler(req: NextRequest, user: any, context: any) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const role = searchParams.get('role');
  const plan = searchParams.get('plan');
  const status = searchParams.get('status'); // active, suspended
  const search = searchParams.get('search');

  // Build query
  const query: any = {};

  if (role) query.role = role;
  if (plan) query.plan = plan;
  if (status === 'suspended') {
    query.isSuspended = true;
  } else if (status === 'active') {
    query.isSuspended = { $ne: true };
  }

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('email displayName username role plan isSuspended payoutStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  // Get stats for each user
  const usersWithStats = await Promise.all(
    users.map(async (u: any) => {
      const [productCount, orderStats] = await Promise.all([
        Product.countDocuments({ creatorId: u._id }),
        Order.aggregate([
          {
            $match: {
              creatorId: u._id,
              paymentStatus: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$total' },
              orders: { $sum: 1 }
            }
          }
        ])
      ]);

      const stats = orderStats[0] || { revenue: 0, orders: 0 };

      return {
        ...u,
        stats: {
          products: productCount,
          revenue: Math.round(stats.revenue * 100) / 100,
          orders: stats.orders
        }
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}

export const GET = withAdminAuth(handler);
