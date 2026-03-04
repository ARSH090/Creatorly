import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';

/**
 * POST /api/public/coupons/validate
 * Validate a coupon code for a specific cart
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { code, creatorId, cart, orderAmount } = body;

        if (!code || !creatorId) {
            return NextResponse.json({ valid: false, message: 'Missing required fields' }, { status: 400 });
        }

        const coupon = await Coupon.findOne({
            creatorId,
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return NextResponse.json({ valid: false, message: 'Invalid coupon code' }, { status: 404 });
        }

        const now = new Date();
        if (coupon.validFrom > now) {
            return NextResponse.json({ valid: false, message: 'Coupon is not yet active' }, { status: 400 });
        }
        if (coupon.validUntil && coupon.validUntil < now) {
            return NextResponse.json({ valid: false, message: 'Coupon has expired' }, { status: 400 });
        }

        if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json({ valid: false, message: 'Coupon usage limit reached' }, { status: 400 });
        }

        // Check minimum order amount
        if (coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
            return NextResponse.json({
                valid: false,
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required`
            }, { status: 400 });
        }

        // Check product applicability
        if (coupon.appliesTo === 'specific' && cart && cart.length > 0) {
            const cartProductIds = cart.map((item: any) => item.id);
            const isApplicable = cartProductIds.some((id: string) =>
                coupon.applicableProducts.map(p => p.toString()).includes(id)
            );

            if (!isApplicable) {
                return NextResponse.json({
                    valid: false,
                    message: 'Coupon is not applicable to any products in your cart'
                }, { status: 400 });
            }
        }

        // Calculate discount (simplified logic for validation)
        let discountType = coupon.discountType;
        let discountValue = coupon.discountValue;

        return NextResponse.json({
            valid: true,
            coupon: {
                id: coupon._id,
                code: coupon.code,
                discountType,
                discountValue,
                maxDiscountCap: coupon.maxDiscountCap
            }
        });

    } catch (error: any) {
        console.error('Coupon Validation Error:', error);
        return NextResponse.json({ valid: false, message: 'Internal server error' }, { status: 500 });
    }
}
