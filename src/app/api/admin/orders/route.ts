import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Order from '@/lib/models/Order';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getAdminSession, logAdminAction, getClientIp, getClientUserAgent, ADMIN_PERMISSIONS, hasPermission } from '@/lib/admin/authMiddleware';

const getOrdersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  paymentMethod: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const refundOrderSchema = z.object({
  orderId: z.string(),
  refundAmount: z.number().optional(),
  reason: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.VIEW_ORDERS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const validation = getOrdersSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.issues }, { status: 400 });
    }

    const { search, status, paymentMethod, minAmount, maxAmount, dateFrom, dateTo, page, limit, sortBy, sortOrder } =
      validation.data;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'paymentDetails.email': { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = minAmount;
      if (maxAmount) query.amount.$lte = maxAmount;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const dateToParsed = new Date(dateTo);
        dateToParsed.setHours(23, 59, 59, 999);
        query.createdAt.$lte = dateToParsed;
      }
    }

    // Execute query
    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .populate('creatorId', 'displayName email')
      .populate('productId', 'name price')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    const enrichedOrders = orders.map((order: any) => ({
      ...order,
      creatorName: order.creatorId?.displayName || 'Unknown',
      productName: order.productId?.name || 'Unknown',
    }));

    return NextResponse.json({
      data: enrichedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: await Order.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders', details: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.REFUND_ORDERS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'refund') {
      const validation = refundOrderSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ error: 'Invalid refund data' }, { status: 400 });
      }

      const { orderId, refundAmount, reason } = validation.data;

      await connectToDatabase();

      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const refundAmt = refundAmount || order.amount;

      if (refundAmt > order.amount) {
        return NextResponse.json({ error: 'Refund amount exceeds order amount' }, { status: 400 });
      }

      // Process refund via Razorpay
      try {
        // TODO: Implement actual Razorpay refund
        order.status = 'refunded';
        order.refund = {
          amount: refundAmt,
          reason,
          processedAt: new Date(),
          status: 'completed',
        };

        await order.save();

        const clientIp = getClientIp(req);
        const userAgent = getClientUserAgent(req);

        await logAdminAction(
          session.id,
          session.email,
          'REFUND',
          'ORDER',
          orderId,
          order.razorpayOrderId,
          `Refund of ₹${refundAmt} for order ${order.razorpayOrderId}`,
          { reason, refundAmount: refundAmt },
          clientIp,
          userAgent
        );

        return NextResponse.json({
          message: 'Refund processed successfully',
          data: {
            orderId: order._id,
            refundAmount: refundAmt,
            status: 'completed',
          },
        });
      } catch (refundError) {
        console.error('Razorpay refund failed:', refundError);
        return NextResponse.json({ error: 'Failed to process refund', details: (refundError as Error).message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Order action error:', error);
    return NextResponse.json({ error: 'Failed to process order action' }, { status: 500 });
  }
}
