import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';

/**
 * POST /api/payments/validate-coupon
 * Validate a coupon code and return discount details
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { code, planId, productId, userId, amount } = await req.json();

        if (!code) {
            return NextResponse.json({
                success: false,
                error: 'Coupon code is required'
            }, { status: 400 });
        }

        // Find coupon (case-insensitive)
        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            status: 'active'
        });

        if (!coupon) {
            return NextResponse.json({
                success: false,
                error: 'Invalid or inactive coupon code'
            }, { status: 404 });
        }

        // Check expiry
        const now = new Date();
        if (coupon.validFrom && now < new Date(coupon.validFrom)) {
            return NextResponse.json({
                success: false,
                error: 'Coupon is not yet valid'
            }, { status: 400 });
        }

        if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
            return NextResponse.json({
                success: false,
                error: 'Coupon has expired'
            }, { status: 400 });
        }

        // Check usage limit
        const usageLimit = (coupon as any).usageLimit || (coupon as any).maxUses;
        const usageCount = (coupon as any).usageCount || (coupon as any).usedCount || 0;
        if (usageLimit && usageCount >= usageLimit) {
            return NextResponse.json({
                success: false,
                error: 'Coupon usage limit reached'
            }, { status: 400 });
        }

        // Check per-user limit
        const userLimit = (coupon as any).usageLimitPerUser || (coupon as any).perCustomerLimit || (coupon as any).usagePerUser;
        if (userLimit && userId) {
            // Note: usage tracking per user is not fully implemented in validation yet
            // but we'll use the correct field name
        }

        // Check minimum purchase
        const minAmount = (coupon as any).minOrderAmount || (coupon as any).minimumPurchaseAmount;
        if (minAmount && amount && amount < minAmount) {
            return NextResponse.json({
                success: false,
                error: `Minimum purchase amount is ₹${minAmount}`
            }, { status: 400 });
        }

        // Check applicable products
        if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
            if (!productId || !coupon.applicableProductIds.some((id: any) => id.toString() === productId)) {
                return NextResponse.json({
                    success: false,
                    error: 'Coupon is not applicable to this product'
                }, { status: 400 });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (amount) {
            if (coupon.discountType === 'percentage') {
                discountAmount = (amount * coupon.discountValue) / 100;
                if (coupon.maxDiscountCap) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscountCap);
                }
            } else if (coupon.discountType === 'fixed') {
                discountAmount = coupon.discountValue;
            }
        }

        const finalAmount = Math.max(0, (amount || 0) - discountAmount);

        return NextResponse.json({
            success: true,
            data: {
                couponId: coupon._id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount: Math.round(discountAmount * 100) / 100,
                finalAmount: Math.round(finalAmount * 100) / 100,
                description: coupon.internalNote || 'Coupon applied'
            }
        });

    } catch (error: any) {
        console.error('Coupon validation error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to validate coupon'
        }, { status: 500 });
    }
}
