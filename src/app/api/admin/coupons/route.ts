import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { logAdminAction } from '@/lib/admin/logger';

/**
 * GET /api/admin/coupons
 * List all coupons with filters
 */
async function getHandler(req: NextRequest, user: any, context: any) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  // Build query
  const query: any = {};

  if (status) query.status = status;

  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    Coupon.find(query)
      .populate('applicableProducts', 'name')
      .populate('applicableCreators', 'displayName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Coupon.countDocuments(query)
  ]);

  return NextResponse.json({
    success: true,
    data: {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}

/**
 * POST /api/admin/coupons
 * Create new coupon
 */
async function postHandler(req: NextRequest, user: any, context: any) {
  await connectToDatabase();

  const body = await req.json();

  // Validate required fields
  if (!body.code || !body.discountType || body.discountValue === undefined) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: code, discountType, discountValue' },
      { status: 400 }
    );
  }

  // Check if code already exists
  const existing = await Coupon.findOne({ code: body.code.toUpperCase() });
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Coupon code already exists' },
      { status: 400 }
    );
  }

  // Create coupon
  const coupon = await Coupon.create({
    ...body,
    code: body.code.toUpperCase(),
    createdBy: user.email,
    usedCount: 0
  });

  // Log action
  await logAdminAction(
    user.email,
    'CREATE_COUPON',
    'coupon',
    coupon._id.toString(),
    { code: coupon.code },
    req
  );

  return NextResponse.json({
    success: true,
    data: { coupon },
    message: 'Coupon created successfully'
  });
}

export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler);
