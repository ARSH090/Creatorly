import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Referral from '@/lib/models/Referral';
import { generateReferralCode } from '@/lib/utils';

export async function GET(req: NextRequest) {
    const { userId } = getAuth(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();
        let referral = await Referral.findOne({ userId });

        // If user doesn't have a referral code yet, generate one
        if (!referral) {
            const code = generateReferralCode(userId);
            referral = await Referral.create({
                userId,
                code,
                clicks: 0,
                conversions: 0,
            });
        }

        return NextResponse.json({
            code: referral.code,
            clicks: referral.clicks,
            conversions: referral.conversions,
            link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ref/${referral.code}`,
        });
    } catch (error) {
        console.error('Error fetching referral:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
