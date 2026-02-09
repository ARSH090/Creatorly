import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { z } from 'zod';

const applyCouponSchema = z.object({
    code: z.string().min(1, 'Coupon code is required').toUpperCase(),
    cartTotal: z.number().positive('Cart total must be positive'),
    creatorId: z.string().optional(),
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

        // Find coupon
        const coupon = await Coupon.findOne({
            code,
            isActive: true,
        });

        if (!coupon) {
            return NextResponse.json(
                { error: 'Invalid coupon code' },
                { status: 404 }
            );
        }

        // Validate coupon
        const now = new Date();

        // Check validity period
        if (now < coupon.validFrom || now > coupon.validUntil) {
            return NextResponse.json(
                { error: 'Coupon has expired or is not yet valid' },
                { status: 400 }
            );
        }

        // Check usage limits
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
            return NextResponse.json(
                { error: 'Coupon usage limit reached' },
                { status: 400 }
            );
        }

        // Check minimum purchase amount
        if (coupon.minimumPurchaseAmount && cartTotal < coupon.minimumPurchaseAmount) {
            return NextResponse.json(
                {
                    error: `Minimum purchase amount is ₹${(coupon.minimumPurchaseAmount / 100).toFixed(2)}`,
                },
                { status: 400 }
            );
        }

        // Check creator-specific coupon
        if (coupon.creatorId && creatorId && coupon.creatorId.toString() !== creatorId) {
            return NextResponse.json(
                { error: 'This coupon is not applicable' },
                { status: 400 }
            );
        }

        // Calculate discount
        let discountAmount = 0;

        if (coupon.discountType === 'percentage') {
            discountAmount = Math.floor((cartTotal * coupon.discountValue) / 100);
        } else {
            discountAmount = coupon.discountValue * 100; // Convert to paise
        }

        // Apply max discount cap if set

        // Ensure discount doesn't exceed cart total
        discountAmount = Math.min(discountAmount, cartTotal);

        const finalTotal = cartTotal - discountAmount;

        return NextResponse.json({
            valid: true,
            coupon: {
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
 * Get available coupons
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const creatorId = searchParams.get('creatorId');

        await connectToDatabase();

        const now = new Date();

        // Query coupons (site-wide or creator-specific)
        const query: Record<string, any> = {
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now },
        };

        if (creatorId) {
            query.$or = [
                { creatorId: null }, // Site-wide coupons
                { creatorId }, // Creator-specific coupons
            ];
        } else {
            query.creatorId = null; // Only site-wide coupons
        }

        const coupons = await Coupon.find(query)
            .select('code description discountType discountValue minimumPurchaseAmount')
            .limit(50);

        return NextResponse.json({
            coupons: coupons.map((c: any) => ({
                code: c.code,
                description: c.description,
                discountType: c.discountType,
                discountValue: c.discountValue,
                minimumPurchaseAmount: c.minimumPurchaseAmount,
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
