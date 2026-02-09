import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate, AffiliateClick } from '@/lib/models/Affiliate';
import * as crypto from 'crypto';
import { z } from 'zod';
import { withAuth } from '@/lib/firebase/withAuth';
import { getIP } from '@/lib/security/ip-detection';

/**
 * GET /api/affiliates/account
 * Get affiliate account info
 */
export const GET = withAuth(async (request, user) => {
    try {
        await connectToDatabase();

        let affiliate = await Affiliate.findOne({ creatorId: user._id });

        if (!affiliate) {
            // Create affiliate account on first access
            const affiliateCode = `aff_${crypto.randomBytes(8).toString('hex')}`;
            affiliate = await Affiliate.create({
                creatorId: user._id,
                affiliateCode,
                commissionRate: 10,
            });
        }

        return NextResponse.json({
            affiliate: {
                id: affiliate._id,
                affiliateCode: affiliate.affiliateCode,
                commissionRate: affiliate.commissionRate,
                totalEarnings: affiliate.totalEarnings,
                referrals: affiliate.referrals,
                clicks: affiliate.clicks,
                conversions: affiliate.conversions,
            },
        });
    } catch (error) {
        console.error('Get affiliate error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch affiliate info' },
            { status: 500 }
        );
    }
});

/**
 * POST /api/affiliates/links
 * Track affiliate link click
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const schema = z.object({
            affiliateCode: z.string(),
            productId: z.string(),
        });

        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const affiliate = await Affiliate.findOne({ affiliateCode: validation.data.affiliateCode });

        if (!affiliate) {
            return NextResponse.json(
                { error: 'Invalid affiliate code' },
                { status: 404 }
            );
        }

        const ipAddress = getIP(request);

        // Record click
        await AffiliateClick.create({
            affiliateId: affiliate._id,
            referralCode: validation.data.affiliateCode,
            ipAddress,
            userAgent: request.headers.get('user-agent') || 'unknown',
        });

        // Update stats
        await Affiliate.updateOne(
            { _id: affiliate._id },
            { $inc: { clicks: 1 } }
        );

        return NextResponse.json({
            affiliateCode: validation.data.affiliateCode,
            productId: validation.data.productId,
            trackingId: `click_${crypto.randomBytes(12).toString('hex')}`,
        });
    } catch (error) {
        console.error('Track affiliate click error:', error);
        return NextResponse.json(
            { error: 'Failed to track click' },
            { status: 500 }
        );
    }
}
