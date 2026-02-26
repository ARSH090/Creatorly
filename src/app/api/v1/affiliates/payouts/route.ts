import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AffiliatePayout from '@/lib/models/AffiliatePayout';
import AffiliateReferral from '@/lib/models/AffiliateReferral';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/affiliates/payouts
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payouts = await AffiliatePayout.find({ creatorId: user._id })
            .populate('affiliateId', 'affiliateEmail affiliateCode')
            .sort({ createdAt: -1 });

        return NextResponse.json({ payouts });
    } catch (error: any) {
        console.error('Error fetching affiliate payouts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/affiliates/payouts
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { affiliateId, amount, referralIds, paymentMethod, transactionId } = body;

        if (!affiliateId || !amount || !referralIds || !Array.isArray(referralIds)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const payout = await AffiliatePayout.create({
            creatorId: user._id,
            affiliateId,
            amount,
            status: 'paid',
            paymentMethod,
            transactionId,
            paidAt: new Date()
        });

        // Update referrals as paid
        await AffiliateReferral.updateMany(
            { _id: { $in: referralIds }, creatorId: user._id },
            { $set: { status: 'paid', payoutId: payout._id } }
        );

        return NextResponse.json({ payout }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating affiliate payout:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
