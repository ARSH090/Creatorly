import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Coupon } from '@/lib/models/Coupon';
import { AdminLog } from '@/lib/models/AdminLog';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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

  } catch (error) {
    console.error('Coupon List Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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

    const coupon = await Coupon.create({
      ...body,
      creatorId: session.user.id, // Admin created
      usageCount: 0
    });

    await AdminLog.create({
      adminEmail: session.user.email,
      action: 'create_coupon',
      targetType: 'coupon',
      targetId: coupon._id,
      changes: body,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(coupon);

  } catch (error) {
    console.error('Create Coupon Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

