import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';

async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const coupons = await Coupon.find({ creatorId: user._id })
            .sort({ createdAt: -1 });
        return NextResponse.json(coupons);
    } catch (error: any) {
        return NextResponse.json(errorResponse('Failed to fetch coupons', error.message), { status: 500 });
    }
}

async function postHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        // Ensure unique code for this creator
        const existing = await Coupon.findOne({ creatorId: user._id, code: body.code.toUpperCase() });
        if (existing) {
            return NextResponse.json(errorResponse('Coupon code already exists'), { status: 400 });
        }

        const coupon = await Coupon.create({
            ...body,
            creatorId: user._id,
            usedCount: 0,
            totalRevenueDriven: 0
        });

        return NextResponse.json(coupon);
    } catch (error: any) {
        return NextResponse.json(errorResponse('Failed to create coupon', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
