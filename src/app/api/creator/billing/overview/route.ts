import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { BillingService } from '@/lib/services/billingService';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

/**
 * GET /api/creator/billing/overview
 */
async function getOverviewHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const overview = await BillingService.getBillingOverview(user._id.toString());
        return NextResponse.json(overview);
    } catch (error: any) {
        console.error('Billing Overview API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch billing overview', error.message), { status: 500 });
    }
}

/**
 * GET /api/creator/billing/earnings
 * Query params: range=daily|monthly|yearly
 */
async function getEarningsHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const range = (searchParams.get('range') as any) || 'monthly';

        const earnings = await BillingService.getCreatorEarnings(user._id.toString(), range);
        return NextResponse.json(earnings);
    } catch (error: any) {
        console.error('Earnings API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch earnings', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getOverviewHandler);
