import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withAdminAuth } from '@/lib/auth/withAuth';

/**
 * GET /api/admin/orders
 * List all orders with filters
 */
async function handler(req: NextRequest, user: any, context: any) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status');
  const creatorId = searchParams.get('creatorId');
  const search = searchParams.get('search');

  // Build query
  const query: any = {};

  if (status) query.paymentStatus = status;
  if (creatorId) query.creatorId = creatorId;

  if (search) {
    query.$or = [
      { customerEmail: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { razorpayOrderId: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('creatorId', 'displayName email')
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query)
  ]);

  return NextResponse.json({
    success: true,
    data: {
      orders,
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
