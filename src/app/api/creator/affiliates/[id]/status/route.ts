import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * PUT /api/creator/affiliates/:id/status
 * Update affiliate status (approve, suspend, activate)
 * Body: { status: 'active' | 'suspended' | 'pending' }
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const affiliateId = params.id;

    const body = await req.json();
    const { status } = body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
        throw new Error('Invalid status. Must be active, suspended, or pending');
    }

    const affiliate = await Affiliate.findOneAndUpdate(
        { _id: affiliateId, creatorId: user._id },
        { $set: { status, updatedAt: new Date() } },
        { new: true }
    ).populate('affiliateId', 'displayName email');

    if (!affiliate) {
        throw new Error('Affiliate not found');
    }

    // TODO: Send status change email to affiliate

    return {
        success: true,
        affiliate,
        message: `Affiliate status updated to ${status}`
    };
}

export const PUT = withCreatorAuth(withErrorHandler(handler));
