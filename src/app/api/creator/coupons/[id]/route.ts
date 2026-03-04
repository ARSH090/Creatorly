import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler, throwError } from '@/lib/utils/errorHandler';
import { CouponSchema } from '@/lib/validation/schemas';

/**
 * GET /api/creator/coupons/:id
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    const coupon = await Coupon.findOne({
        _id: id,
        creatorId: user._id
    });

    if (!coupon) {
        throwError.notFound('Coupon not found');
    }

    return { coupon };
}

/**
 * PUT /api/creator/coupons/:id
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;
    const body = await req.json();

    const coupon = await Coupon.findOne({
        _id: id,
        creatorId: user._id
    });

    if (!coupon) {
        throwError.notFound('Coupon not found');
    }

    const validation = CouponSchema.partial().safeParse(body);
    if (!validation.success) {
        throwError.badRequest('Validation failed', validation.error.format());
    }

    const data = validation.data!;

    // If code is changing, check for duplicates
    if (data.code && data.code.toUpperCase() !== (coupon as any).code) {
        const existing = await Coupon.findOne({
            creatorId: user._id,
            code: data.code.toUpperCase(),
            _id: { $ne: id }
        });
        if (existing) {
            throwError.badRequest('Coupon code already exists');
        }
        data.code = data.code.toUpperCase();
    }

    Object.assign(coupon as any, data);
    await (coupon as any).save();

    return {
        coupon,
        message: 'Coupon updated successfully'
    };
}

/**
 * DELETE /api/creator/coupons/:id
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    const coupon = await Coupon.findOneAndDelete({
        _id: id,
        creatorId: user._id
    });

    if (!coupon) {
        throwError.notFound('Coupon not found');
    }

    return {
        success: true,
        message: 'Coupon deleted successfully'
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const PUT = withCreatorAuth(withErrorHandler(putHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
