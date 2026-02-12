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
 * Body: { email, commissionRate, productIds? }
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    if (!hasFeature(user.plan || 'free', 'affiliates')) {
        throw new Error('Affiliate program requires Creator Pro plan');
    }

    const body = await req.json();
    const { email, commissionRate = 20, productIds } = body;

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
            firebaseUid: `temp_${crypto.randomBytes(8).toString('hex')}`, // Temporary
            username: `affiliate_${Date.now()}`,
            emailVerified: false
        });
    }

    // Check if affiliate relationship already exists
    const existing = await Affiliate.findOne({
        creatorId: user._id,
        affiliateId: affiliateUser._id
    });

    if (existing) {
        throw new Error('Affiliate relationship already exists');
    }

    // Generate unique link code
    const uniqueLinkCode = crypto.randomBytes(8).toString('hex');

    const affiliate = await Affiliate.create({
        creatorId: user._id,
        affiliateId: affiliateUser._id,
        productIds: productIds || [],
        commissionRate,
        uniqueLinkCode,
        status: 'pending'
    });

    // TODO: Send invitation email with affiliate link
    console.log(`Affiliate invited: ${email} with code: ${uniqueLinkCode}`);

    return {
        success: true,
        affiliate,
        affiliateLink: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${uniqueLinkCode}`
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
