import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/types/api';

const createCouponSchema = z.object({
    code: z.string().min(1, 'Coupon code is required').toUpperCase(),
    discountType: z.enum(['percentage', 'fixed', 'free']),
    discountValue: z.number().min(0, 'Discount value must be positive'),
    maxDiscountCap: z.number().optional(),
    appliesTo: z.enum(['all', 'specific', 'type', 'minimum']),
    applicableProductIds: z.array(z.string()).optional(),
    applicableProductType: z.string().optional(),
    minimumPurchaseAmount: z.number().optional(),
    maxUses: z.number().optional(),
    perCustomerLimit: z.number().default(1),
    firstTimeOnly: z.boolean().default(false),
    validFrom: z.date().optional(),
    expiresAt: z.date().optional(),
    showHintOnStorefront: z.boolean().default(false),
    internalNote: z.string().optional()
});

/**
 * GET /api/coupons - List all coupons for the authenticated creator
 */
export const GET = withCreatorAuth(async (req, user) => {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        
        let query: any = { creatorId: user._id };
        
        if (status && status !== 'all') {
            if (status === 'active') {
                query.isActive = true;
                query.expiresAt = { $ne: null, $gt: new Date() };
            } else if (status === 'expired') {
                query.expiresAt = { $lt: new Date() };
            } else if (status === 'paused') {
                query.isActive = false;
            }
        }
        
        if (search) {
            query.code = { $regex: search, $options: 'i' };
        }
        
        const coupons = await Coupon.find(query)
            .sort({ createdAt: -1 })
            .limit(100);
        
        return NextResponse.json(successResponse('Coupons retrieved', JSON.parse(JSON.stringify(coupons))));
    } catch (error: any) {
        console.error('GET Coupons Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch coupons', error.message), { status: 500 });
    }
});

/**
 * POST /api/coupons - Create a new coupon
 */
export const POST = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const validation = createCouponSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                errorResponse('Validation failed', validation.error.format()),
                { status: 400 }
            );
        }
        
        await connectToDatabase();
        
        // Check if coupon code already exists for this creator
        const existingCoupon = await Coupon.findOne({
            creatorId: user._id,
            code: validation.data.code
        });
        
        if (existingCoupon) {
            return NextResponse.json(
                errorResponse('Coupon code already exists'),
                { status: 409 }
            );
        }
        
        const coupon = new Coupon({
            ...validation.data,
            creatorId: user._id,
            usedCount: 0,
            totalRevenueDriven: 0,
            isActive: true
        });
        
        await coupon.save();
        
        return NextResponse.json(successResponse('Coupon created successfully', JSON.parse(JSON.stringify(coupon))), { status: 201 });
    } catch (error: any) {
        console.error('Create Coupon Error:', error);
        return NextResponse.json(errorResponse('Failed to create coupon', error.message), { status: 500 });
    }
});

/**
 * PUT /api/coupons - Update a coupon
 */
export const PUT = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const { id, ...updateData } = body;
        
        if (!id) {
            return NextResponse.json(errorResponse('Coupon ID is required'), { status: 400 });
        }
        
        await connectToDatabase();
        
        const coupon = await Coupon.findOneAndUpdate(
            { _id: id, creatorId: user._id },
            updateData,
            { new: true }
        );
        
        if (!coupon) {
            return NextResponse.json(errorResponse('Coupon not found'), { status: 404 });
        }
        
        return NextResponse.json(successResponse('Coupon updated successfully', JSON.parse(JSON.stringify(coupon))));
    } catch (error: any) {
        console.error('Update Coupon Error:', error);
        return NextResponse.json(errorResponse('Failed to update coupon', error.message), { status: 500 });
    }
});

/**
 * DELETE /api/coupons - Delete a coupon
 */
export const DELETE = withCreatorAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json(errorResponse('Coupon ID is required'), { status: 400 });
        }
        
        await connectToDatabase();
        
        const coupon = await Coupon.findOneAndDelete({
            _id: id,
            creatorId: user._id
        });
        
        if (!coupon) {
            return NextResponse.json(errorResponse('Coupon not found'), { status: 404 });
        }
        
        return NextResponse.json(successResponse('Coupon deleted successfully'));
    } catch (error: any) {
        console.error('Delete Coupon Error:', error);
        return NextResponse.json(errorResponse('Failed to delete coupon', error.message), { status: 500 });
    }
});
