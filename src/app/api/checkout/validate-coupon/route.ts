import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import { validateCoupon } from '@/lib/services/couponValidator';

/**
 * POST /api/checkout/validate-coupon
 * Validate coupon code for checkout
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { code, orderAmount, productIds, creatorId, customerEmail } = body;

        if (!code || !orderAmount || !productIds || !creatorId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate coupon
        const result = await validateCoupon(
            code,
            orderAmount,
            productIds,
            creatorId,
            customerEmail
        );

        if (!result.valid) {
            return NextResponse.json(
                { success: false, error: result.reason || 'Invalid coupon' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                valid: true,
                discount: result.discount,
                code,
                finalAmount: Math.max(0, orderAmount - (result.discount || 0))
            }
        });
    } catch (error: any) {
        console.error('Validate coupon error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to validate coupon' },
            { status: 500 }
        );
    }
}
