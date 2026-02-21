import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { BillingService } from '@/lib/services/billingService';
import { Payout } from '@/lib/models/Payout';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

/**
 * GET - List payout history for a creator
 */
async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const payouts = await Payout.find({ creatorId: user._id })
            .sort({ createdAt: -1 });

        return NextResponse.json(payouts);
    } catch (error: any) {
        console.error('Payouts GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch payouts', error.message), { status: 500 });
    }
}

/**
 * POST - Request a payout
 */
async function postHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { amount, notes } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(errorResponse('Valid payout amount is required'), { status: 400 });
        }

        const payout = await BillingService.requestPayout(user._id.toString(), amount, notes);
        return NextResponse.json(payout);
    } catch (error: any) {
        console.error('Payouts POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to request payout', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
