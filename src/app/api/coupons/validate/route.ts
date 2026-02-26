import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { z } from 'zod';

const applyCouponSchema = z.object({
    code: z.string().min(1, 'Coupon code is required').toUpperCase(),
    cartTotal: z.number().positive('Cart total must be positive'),
    creatorId: z.string().min(1, 'Creator ID is required'),
});

/**
 * Validate and apply coupon to cart
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = applyCouponSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { errors: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const { code, cartTotal, creatorId } = validation.data;

        // Find coupon for specific creator
        const coupon = await Coupon.findOne({
            creatorId,
            code: code.toUpperCase(),
            isActive: true,
        });

        if (!coupon) {
            return NextResponse.json(
                { error: 'Invalid or inactive coupon code' },
                { status: 404 }
            );
        }

        // Validate coupon
        const now = new Date();

        // Check validity period
        if (now < coupon.validFrom || (coupon.expiresAt && now > coupon.expiresAt)) {
            return NextResponse.json(
                { error: 'Coupon has expired or is not yet valid' },
                { status: 400 }
            );
        }

        // Check usage limits
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json(
                { error: 'Coupon usage limit reached' },
                { status: 400 }
            );
        }

        // Check minimum purchase amount
        if (coupon.minimumPurchaseAmount && cartTotal < coupon.minimumPurchaseAmount) {
            return NextResponse.json(
                {
                    error: `Minimum purchase amount is ₹${(coupon.minimumPurchaseAmount).toFixed(2)}`,
                },
                { status: 400 }
            );
        }

        // Calculate discount
        let discountAmount = 0;

        if (coupon.discountType === 'percentage') {
            discountAmount = Math.floor((cartTotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountCap) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscountCap * 100); // converting cap to paise
            }
        } else if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue * 100; // Convert to paise
        } else if (coupon.discountType === 'free') {
            discountAmount = cartTotal;
        }

        // Ensure discount doesn't exceed cart total
        discountAmount = Math.min(discountAmount, cartTotal);

        const finalTotal = cartTotal - discountAmount;

        return NextResponse.json({
            valid: true,
            coupon: {
                id: coupon._id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
                finalTotal,
            },
        });
    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json(
            { error: 'Failed to validate coupon' },
            { status: 500 }
        );
    }
}

/**
 * Get available coupons for storefront hint
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const creatorId = searchParams.get('creatorId');

        if (!creatorId) {
            return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
        }

        await connectToDatabase();

        const now = new Date();

        // Query active coupons that should be shown on storefront
        const coupons = await Coupon.find({
            creatorId,
            isActive: true,
            showHintOnStorefront: true,
            validFrom: { $lte: now },
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gte: now } },
                { expiresAt: null }
            ]
        })
            .select('code discountType discountValue minimumPurchaseAmount internalNote')
            .limit(10);

        return NextResponse.json({
            coupons: coupons.map((c: any) => ({
                code: c.code,
                discountType: c.discountType,
                discountValue: c.discountValue,
                minimumPurchaseAmount: c.minimumPurchaseAmount,
                note: c.internalNote
            })),
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch coupons' },
            { status: 500 }
        );
    }
}

