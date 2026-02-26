import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AffiliateReferral from '@/lib/models/AffiliateReferral';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/affiliates/referrals
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const referrals = await AffiliateReferral.find({ creatorId: user._id })
            .populate('affiliateId', 'affiliateEmail affiliateCode')
            .populate('orderId', 'orderNumber status paidAt')
            .sort({ createdAt: -1 });

        return NextResponse.json({ referrals });
    } catch (error: any) {
        console.error('Error fetching affiliate referrals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
