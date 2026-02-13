import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

import { User } from '@/lib/models/User';

/**
 * POST /api/creator/affiliates/invite
 * Invite a new affiliate
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const { email, commissionRate } = await req.json();

    if (!email) throw new Error('Email is required');

    // Find the user to be invited
    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) {
        throw new Error('User not found. Affiliates must have an active Creatorly account first.');
    }

    // Check if already an affiliate
    const existing = await Affiliate.findOne({
        creatorId: user._id,
        affiliateId: invitee._id
    });

    if (existing) throw new Error('This user is already an affiliate for you');

    // Generate unique affiliate code
    const affiliateCode = `AFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const affiliate = await (Affiliate as any).create({
        creatorId: user._id,
        affiliateId: invitee._id,
        affiliateCode,
        commissionRate: commissionRate || 10,
        status: 'pending',
        isActive: true
    });

    // TODO: Send invite email
    console.log(`[Email] Sending affiliate invite to ${email}`);

    return affiliate;
}

export const POST = withCreatorAuth(withErrorHandler(handler));
