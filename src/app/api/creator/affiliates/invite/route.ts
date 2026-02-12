import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';
import crypto from 'crypto';

/**
 * POST /api/creator/affiliates/invite
 * Send affiliate invitation
 * Body: { email, commissionRate }
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    if (!hasFeature(user.plan || 'free', 'affiliates')) {
        throw new Error('Affiliate program requires Creator Pro plan');
    }

    const body = await req.json();
    const { email, commissionRate = 20 } = body;

    if (!email) {
        throw new Error('Email is required');
    }

    // Find or create affiliate user
    let affiliateUser = await User.findOne({ email: email.toLowerCase() });

    if (!affiliateUser) {
        // Create placeholder user with affiliate role
        affiliateUser = await User.create({
            email: email.toLowerCase(),
            displayName: email.split('@')[0],
            role: 'affiliate',
            firebaseUid: `temp_${crypto.randomBytes(8).toString('hex')}`,
            username: `affiliate_${Date.now()}`,
            emailVerified: false
        });
    }

    // Generate unique affiliate code
    const affiliateCode = `${user.username || 'creator'}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

    // Check if affiliate relationship already exists (by creator + affiliateCode)
    const existing = await Affiliate.findOne({
        creatorId: user._id,
        affiliateCode
    });

    if (existing) {
        throw new Error('Affiliate code already exists');
    }

    const affiliate = await Affiliate.create({
        creatorId: user._id,
        affiliateCode,
        commissionRate,
        totalEarnings: 0,
        totalCommission: 0,
        paidCommission: 0,
        referrals: 0,
        clicks: 0,
        conversions: 0,
        status: 'active',
        isActive: true
    });

    // TODO: Send invitation email with affiliate link
    console.log(`Affiliate created: ${email} with code: ${affiliateCode}`);

    return {
        success: true,
        affiliate,
        affiliateLink: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${affiliateCode}`
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
