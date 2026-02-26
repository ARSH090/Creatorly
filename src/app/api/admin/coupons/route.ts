import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Coupon } from '@/lib/models/Coupon';
import { AdminLog } from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { syncRazorpayOffer } from '@/lib/payments/razorpay';

async function getHandler(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const query: any = {};
  if (search) {
    query.code = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    Coupon.find(query)
      .populate('creatorId', 'displayName email')
      .populate('applicableProducts', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Coupon.countDocuments(query)
  ]);

  return NextResponse.json({
    coupons,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
}

async function postHandler(req: NextRequest, user: any) {
  const body = await req.json();
  await dbConnect();

  // Validation
  if (!body.code || !body.discountType || !body.discountValue) {
    return new NextResponse('Missing required fields', { status: 400 });
  }

  const existing = await Coupon.findOne({ code: body.code });
  if (existing) {
    return new NextResponse('Coupon code already exists', { status: 400 });
  }

  // Sync with Razorpay (best-effort — coupon is still created if this fails)
  let razorpayOfferId = undefined;
  try {
    const rpOffer = await syncRazorpayOffer({
      name: body.description || body.code,
      code: body.code,
      description: body.description,
      type: body.discountType,
      value: body.discountValue,
      maxAmount: body.maxDiscountAmount,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined
    });
    razorpayOfferId = rpOffer.id;
  } catch (error: any) {
    console.error('Razorpay offer sync failed (continuing without gateway sync):', error?.message || error);
    // Continue — coupon will work locally without a Razorpay offer ID
  }

  const coupon = await Coupon.create({
    ...body,
    maxUses: body.usageLimit,
    creatorId: user._id, // Admin created
    razorpayOfferId,
    usedCount: 0
  });

  await AdminLog.create({
    adminEmail: user.email,
    action: 'create_coupon',
    targetType: 'coupon',
    targetId: coupon._id,
    changes: { ...body, razorpayOfferId },
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
  });

  return NextResponse.json(coupon);
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
export const POST = withAdminAuth(withErrorHandler(postHandler));

