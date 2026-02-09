import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withAdminAuth } from '@/lib/firebase/withAuth';

export const GET = withAdminAuth(async (req, user) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive) query.isActive = isActive === 'true';

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = withAdminAuth(async (req, user) => {
  try {
    await connectToDatabase();
    const body = await req.json();

    const coupon = await Coupon.create({
      ...body,
      currentUses: 0
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
});

export const PUT = withAdminAuth(async (req, user) => {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updateData } = body;

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
});

export const DELETE = withAdminAuth(async (req, user) => {
  try {
    if (user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized - SuperAdmin required for deletion' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await connectToDatabase();
    await Coupon.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
