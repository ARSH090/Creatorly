import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withAdminAuth, logAdminAction } from '@/lib/firebase/withAdminAuth';

/**
 * GET /api/admin/coupons/:id
 * Get single coupon details
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const couponId = params.id;

    const coupon = await Coupon.findById(couponId)
        .populate('applicableProducts', 'name')
        .populate('applicableCreators', 'displayName email');

    if (!coupon) {
        return NextResponse.json(
            { success: false, error: 'Coupon not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
        success: true,
        data: { coupon }
    });
}

/**
 * PUT /api/admin/coupons/:id
 * Update coupon
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const couponId = params.id;

    const body = await req.json();

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
        return NextResponse.json(
            { success: false, error: 'Coupon not found' },
            { status: 404 }
        );
    }

    // Track changes
    const changes: any = {};
    const updateFields = [
        'description', 'discountValue', 'minOrderAmount', 'maxDiscountAmount',
        'usageLimit', 'usagePerUser', 'validFrom', 'validUntil', 'status',
        'applicableProducts', 'applicableCreators'
    ];

    updateFields.forEach(field => {
        if (body[field] !== undefined && body[field] !== coupon[field]) {
            changes[field] = { from: coupon[field], to: body[field] };
            coupon[field] = body[field];
        }
    });

    await coupon.save();

    // Log action
    await logAdminAction(
        user.email,
        'UPDATE_COUPON',
        'coupon',
        couponId,
        changes,
        req
    );

    return NextResponse.json({
        success: true,
        data: { coupon },
        message: 'Coupon updated successfully'
    });
}

/**
 * DELETE /api/admin/coupons/:id
 * Delete coupon
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const couponId = params.id;

    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
        return NextResponse.json(
            { success: false, error: 'Coupon not found' },
            { status: 404 }
        );
    }

    // Log action
    await logAdminAction(
        user.email,
        'DELETE_COUPON',
        'coupon',
        couponId,
        { code: coupon.code },
        req
    );

    return NextResponse.json({
        success: true,
        message: 'Coupon deleted successfully'
    });
}

export const GET = withAdminAuth(getHandler);
export const PUT = withAdminAuth(putHandler);
export const DELETE = withAdminAuth(deleteHandler);
