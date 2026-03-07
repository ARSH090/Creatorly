import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler, throwError } from '@/lib/utils/errorHandler';
import { CouponSchema } from '@/lib/validation/schemas';

/**
 * GET /api/creator/coupons
 * List all coupons for the creator
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: any = { creatorId: user._id };

    if (status === 'Active') {
        filter.isActive = true;
    } else if (status === 'Inactive') {
        filter.isActive = false;
    }

    if (search) {
        filter.code = { $regex: search, $options: 'i' };
    }

    const [coupons, stats] = await Promise.all([
        Coupon.find(filter).sort({ createdAt: -1 }),
        Coupon.aggregate([
            { $match: { creatorId: user._id } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    totalRedemptions: { $sum: '$usageCount' },
                    totalRevenue: { $sum: '$totalRevenueDriven' }
                }
            }
        ])
    ]);

    return {
        coupons,
        stats: stats[0] || { total: 0, active: 0, totalRedemptions: 0, totalRevenue: 0 }
    };
}

/**
 * POST /api/creator/coupons
 * Create a new coupon
 */
async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const body = await req.json();

    const validation = CouponSchema.safeParse(body);
    if (!validation.success) {
        throwError.badRequest('Validation failed', validation.error.format());
    }

    const data = validation.data!;

    // Check for duplicate code for this creator
    const existing = await Coupon.findOne({
        creatorId: user._id,
        code: data.code.toUpperCase()
    });

    if (existing) {
        throwError.badRequest('Coupon code already exists');
    }

    const coupon = await Coupon.create({
        ...data,
        creatorId: user._id,
        code: data.code.toUpperCase(),
        usageCount: 0
    });

    return {
        coupon,
        message: 'Coupon created successfully'
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
