import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AbandonedCheckout from '@/lib/models/AbandonedCheckout';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';
import abandonedCheckoutRecovery from '@/lib/services/abandonedCheckoutRecovery';

/**
 * GET /api/abandoned-checkout - Get abandoned checkout analytics
 */
export const GET = withCreatorAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const timeframe = searchParams.get('timeframe') || '30d';
        
        const analytics = await abandonedCheckoutRecovery.getRecoveryAnalytics(user._id.toString(), timeframe);
        
        return NextResponse.json(successResponse('Analytics retrieved', analytics));
    } catch (error: any) {
        console.error('Abandoned Checkout Analytics Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch analytics', error.message), { status: 500 });
    }
});

/**
 * POST /api/abandoned-checkout - Trigger recovery emails manually
 */
export const POST = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const { checkoutId, emailType } = body;
        
        if (!checkoutId || !emailType) {
            return NextResponse.json(errorResponse('Checkout ID and email type are required'), { status: 400 });
        }
        
        // Verify checkout belongs to this creator
        const checkout = await AbandonedCheckout.findOne({
            _id: checkoutId,
            creatorId: user._id,
            status: 'abandoned'
        });
        
        if (!checkout) {
            return NextResponse.json(errorResponse('Checkout not found or not eligible for recovery'), { status: 404 });
        }
        
        let result = false;
        if (emailType === 'first') {
            result = await abandonedCheckoutRecovery.sendFirstRecoveryEmail(checkoutId);
        } else if (emailType === 'second') {
            result = await abandonedCheckoutRecovery.sendSecondRecoveryEmail(checkoutId);
        }
        
        if (result) {
            return NextResponse.json(successResponse('Recovery email sent successfully'));
        } else {
            return NextResponse.json(errorResponse('Failed to send recovery email'), { status: 500 });
        }
    } catch (error: any) {
        console.error('Manual Recovery Email Error:', error);
        return NextResponse.json(errorResponse('Failed to send recovery email', error.message), { status: 500 });
    }
});

/**
 * PUT /api/abandoned-checkout - Mark checkout as recovered
 */
export const PUT = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const { checkoutId, orderId } = body;
        
        if (!checkoutId || !orderId) {
            return NextResponse.json(errorResponse('Checkout ID and Order ID are required'), { status: 400 });
        }
        
        await abandonedCheckoutRecovery.markAsRecovered(checkoutId, orderId);
        
        return NextResponse.json(successResponse('Checkout marked as recovered'));
    } catch (error: any) {
        console.error('Mark Recovered Error:', error);
        return NextResponse.json(errorResponse('Failed to mark checkout as recovered', error.message), { status: 500 });
    }
});
