import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Coupon } from '@/lib/models/EnhancedCoupon';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getAdminSession, logAdminAction, getClientIp, getClientUserAgent, ADMIN_PERMISSIONS, hasPermission } from '@/lib/admin/authMiddleware';

const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  description: z.string().optional(),
  minPurchase: z.number().min(0).default(0),
  maxDiscount: z.number().optional(),
  maxUses: z.number().min(1),
  validFrom: z.string().datetime(),
  validityPeriodMonths: z.number().min(1).max(24).optional(),
  products: z.array(z.string()).optional(),
  creators: z.array(z.string()).optional(),
});

const updateCouponSchema = z.object({
  description: z.string().optional(),
  maxUses: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validityPeriodMonths: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.MANAGE_COUPONS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const { search, isActive, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = searchParams;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query: any = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const coupons = await Coupon.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Coupon.countDocuments(query);

    const enrichedCoupons = coupons.map((coupon: any) => ({
      ...coupon,
      remainingUses: coupon.maxUses - coupon.usedCount,
      usagePercentage: ((coupon.usedCount / coupon.maxUses) * 100).toFixed(2),
      daysUntilExpiry: Math.ceil((new Date(coupon.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      isExpired: new Date(coupon.validUntil) < new Date(),
    }));

    return NextResponse.json({
      data: enrichedCoupons,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.CREATE_COUPONS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid coupon data', details: validation.error.issues }, { status: 400 });
    }

    const {
      code,
      type,
      value,
      description,
      minPurchase,
      maxDiscount,
      maxUses,
      validFrom,
      validityPeriodMonths,
      products,
      creators,
    } = validation.data;

    await connectToDatabase();

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return NextResponse.json({ error: `Coupon code '${code}' already exists` }, { status: 409 });
    }

    // Calculate validUntil
    const validFromDate = new Date(validFrom);
    const validUntilDate = new Date(validFromDate);

    if (validityPeriodMonths) {
      validUntilDate.setMonth(validUntilDate.getMonth() + validityPeriodMonths);
    } else {
      // Default to 1 month
      validUntilDate.setMonth(validUntilDate.getMonth() + 1);
    }

    // Validation
    if (type === 'percentage' && (value < 0 || value > 100)) {
      return NextResponse.json({ error: 'Percentage value must be between 0-100' }, { status: 400 });
    }

    const coupon = new Coupon({
      code,
      type,
      value,
      description,
      minPurchase,
      maxDiscount,
      maxUses,
      createdBy: session.id,
      validFrom: validFromDate,
      validUntil: validUntilDate,
      validityPeriodMonths,
      isActive: true,
      products,
      creators,
      usedCount: 0,
      userUsage: [],
      metadata: {
        appliedCount: 0,
        successCount: 0,
        failedCount: 0,
        totalDiscountGiven: 0,
      },
    });

    await coupon.save();

    const clientIp = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    await logAdminAction(
      session.id,
      session.email,
      'CREATE',
      'COUPON',
      coupon._id.toString(),
      code,
      `Created coupon code: ${code}`,
      {
        type,
        value,
        maxUses,
        validityPeriodMonths,
        validUntil: validUntilDate.toISOString(),
      },
      clientIp,
      userAgent
    );

    return NextResponse.json(
      {
        message: 'Coupon created successfully',
        data: {
          id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          maxUses: coupon.maxUses,
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
          daysUntilExpiry: Math.ceil((validUntilDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.MANAGE_COUPONS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { couponId, ...updateData } = body;

    const validation = updateCouponSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
    }

    await connectToDatabase();

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const changes: any = {};
    const update = validation.data;

    if (update.description !== undefined && update.description !== coupon.description) {
      changes.description = { old: coupon.description, new: update.description };
      coupon.description = update.description;
    }

    if (update.maxUses !== undefined && update.maxUses !== coupon.maxUses) {
      changes.maxUses = { old: coupon.maxUses, new: update.maxUses };
      coupon.maxUses = update.maxUses;
    }

    if (typeof update.isActive === 'boolean' && update.isActive !== coupon.isActive) {
      changes.isActive = { old: coupon.isActive, new: update.isActive };
      coupon.isActive = update.isActive;
    }

    if (update.validityPeriodMonths) {
      const newValidUntil = new Date(update.validFrom ? new Date(update.validFrom) : coupon.validFrom);
      newValidUntil.setMonth(newValidUntil.getMonth() + update.validityPeriodMonths);
      changes.validUntil = { old: coupon.validUntil, new: newValidUntil };
      coupon.validUntil = newValidUntil;
      coupon.validityPeriodMonths = update.validityPeriodMonths;
    }

    if (update.validFrom) {
      changes.validFrom = { old: coupon.validFrom, new: update.validFrom };
      coupon.validFrom = new Date(update.validFrom);
    }

    await coupon.save();

    const clientIp = getClientIp(req);

    await logAdminAction(
      session.id,
      session.email,
      'UPDATE',
      'COUPON',
      couponId,
      coupon.code,
      `Updated coupon: ${Object.keys(changes).join(', ')}`,
      changes,
      clientIp
    );

    return NextResponse.json({
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, ADMIN_PERMISSIONS.DELETE_COUPONS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const couponId = searchParams.get('id');

    if (!couponId) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    await connectToDatabase();

    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const clientIp = getClientIp(req);

    await logAdminAction(
      session.id,
      session.email,
      'DELETE',
      'COUPON',
      couponId,
      coupon.code,
      `Deleted coupon code: ${coupon.code}`,
      { code: coupon.code, maxUses: coupon.maxUses },
      clientIp
    );

    return NextResponse.json({
      message: 'Coupon deleted successfully',
      data: { id: couponId, code: coupon.code },
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
