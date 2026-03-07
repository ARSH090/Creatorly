import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';
import { errorResponse } from '@/types/api';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { code, productId, creatorId, orderAmount } = await req.json();

        if (!code || !creatorId) {
            return NextResponse.json(errorResponse('Code and Creator ID are required'), { status: 400 });
        }

        const coupon = await Coupon.findOne({
            creatorId,
            code: code.toUpperCase().trim(),
            isActive: true
        });

        if (!coupon) {
            return NextResponse.json({ valid: false, message: 'Invalid coupon code' });
        }

        // Validity Checks
        const now = new Date();
        if (coupon.validFrom && coupon.validFrom > now) {
            return NextResponse.json({ valid: false, message: 'Coupon not yet active' });
        }
        if (coupon.validUntil && coupon.validUntil < now) {
            return NextResponse.json({ valid: false, message: 'Coupon expired' });
        }
        if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json({ valid: false, message: 'Coupon usage limit reached' });
        }

        // Minimum Order Amount Check
        const minAmount = coupon.minOrderAmount || coupon.minimumOrderAmount || 0;
        if (orderAmount < minAmount) {
            return NextResponse.json({
                valid: false,
                message: `Minimum order amount of ₹${(minAmount / 100).toLocaleString()} required`
            });
        }

        // Product Applicability Check
        if (coupon.appliesTo === 'specific' && productId) {
            const productIds = coupon.applicableProductIds || coupon.applicableProducts || [];
            if (!productIds.some(id => id.toString() === productId)) {
                return NextResponse.json({ valid: false, message: 'Coupon not applicable to this product' });
            }
        }

        // Calculate Discount
        let discountAmount = 0;
        const qty = Number(req.headers.get('x-quantity') || 1); // Get quantity from header or body if possible

        if (coupon.discountType === 'percentage') {
            discountAmount = Math.floor(orderAmount * (coupon.discountValue / 100));
            if (coupon.maxDiscountCap && discountAmount > coupon.maxDiscountCap) {
                discountAmount = coupon.maxDiscountCap;
            }
        } else if (coupon.discountType === 'fixed') {
            discountAmount = Math.min(coupon.discountValue, orderAmount);
        } else if (coupon.discountType === 'bogo' && coupon.bogoConfig) {
            const { buyQuantity, getQuantity, getDiscountValue } = coupon.bogoConfig;
            const setSize = buyQuantity + getQuantity;
            const sets = Math.floor(qty / setSize);
            const itemsToDiscount = sets * getQuantity;

            // Assume unit price = orderAmount / qty
            const unitPrice = orderAmount / qty;
            discountAmount = Math.floor(itemsToDiscount * unitPrice * (getDiscountValue / 100));
        }

        return NextResponse.json({
            valid: true,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            finalAmount: orderAmount - discountAmount
        });

    } catch (error: any) {
        console.error('Coupon Validation Error:', error);
        return NextResponse.json(errorResponse('Internal server error during validation'), { status: 500 });
    }
}
