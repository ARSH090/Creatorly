import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/types/api';

const bulkCouponSchema = z.object({
    quantity: z.number().min(1).max(1000, 'Maximum 1000 coupons per batch'),
    prefix: z.string().min(1, 'Prefix is required'),
    discountType: z.enum(['percentage', 'fixed', 'free']),
    discountValue: z.number().min(0, 'Discount value must be positive'),
    maxUses: z.number().min(1, 'Max uses must be at least 1'),
    expiresAt: z.date().optional(),
    maxDiscountCap: z.number().optional(),
    minimumPurchaseAmount: z.number().optional(),
    perCustomerLimit: z.number().default(1),
    firstTimeOnly: z.boolean().default(false),
    showHintOnStorefront: z.boolean().default(false),
    internalNote: z.string().optional()
});

function generateCouponCode(prefix: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${randomPart}`;
}

/**
 * POST /api/coupons/bulk - Generate multiple coupons at once
 */
export const POST = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const validation = bulkCouponSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                errorResponse('Validation failed', validation.error.format()),
                { status: 400 }
            );
        }
        
        await connectToDatabase();
        
        const { quantity, prefix, ...couponData } = validation.data;
        const coupons = [];
        const existingCodes = new Set();
        
        // Get existing codes to avoid duplicates
        const existingCoupons = await Coupon.find({
            creatorId: user._id,
            code: { $regex: `^${prefix}` }
        }).select('code');
        
        existingCoupons.forEach(coupon => existingCodes.add(coupon.code));
        
        // Generate unique coupons
        for (let i = 0; i < quantity; i++) {
            let code;
            let attempts = 0;
            
            do {
                code = generateCouponCode(prefix);
                attempts++;
                if (attempts > 100) {
                    throw new Error('Unable to generate unique coupon codes. Try a different prefix.');
                }
            } while (existingCodes.has(code));
            
            existingCodes.add(code);
            
            const coupon = new Coupon({
                ...couponData,
                creatorId: user._id,
                code,
                usedCount: 0,
                totalRevenueDriven: 0,
                isActive: true,
                isBulkGenerated: true,
                bulkBatchId: `${prefix}-${Date.now()}`
            });
            
            coupons.push(coupon);
        }
        
        // Save all coupons in batch
        await Coupon.insertMany(coupons);
        
        return NextResponse.json(successResponse('Bulk coupons generated successfully', JSON.parse(JSON.stringify({
            coupons,
            batchId: coupons[0].bulkBatchId,
            totalGenerated: quantity
        }))), { status: 201 });
        
    } catch (error: any) {
        console.error('Bulk Coupon Generation Error:', error);
        return NextResponse.json(errorResponse('Failed to generate bulk coupons', error.message), { status: 500 });
    }
});

/**
 * GET /api/coupons/bulk - Get bulk generation statistics
 */
export const GET = withCreatorAuth(async (req, user) => {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(req.url);
        const batchId = searchParams.get('batchId');
        
        let matchStage: any = { creatorId: user._id, isBulkGenerated: true };
        if (batchId) {
            matchStage.bulkBatchId = batchId;
        }
        
        const stats = await Coupon.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$bulkBatchId',
                    totalCoupons: { $sum: 1 },
                    usedCoupons: { $sum: '$usedCount' },
                    totalRevenue: { $sum: '$totalRevenueDriven' },
                    createdAt: { $first: '$createdAt' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 50 }
        ]);
        
        return NextResponse.json(successResponse('Bulk statistics retrieved', JSON.parse(JSON.stringify(stats))));
    } catch (error: any) {
        console.error('Bulk Stats Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch bulk statistics', error.message), { status: 500 });
    }
});
