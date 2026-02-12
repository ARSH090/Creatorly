import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * GET /api/creator/affiliates
 * List all affiliates for the creator with performance stats
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Check if creator has affiliate feature
    if (!hasFeature(user.plan || 'free', 'affiliates')) {
        throw new Error('Affiliate program requires Creator Pro plan');
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // active, pending, suspended

    const query: any = { creatorId: user._id };
    if (status) query.status = status;

    const affiliates = await Affiliate.find(query)
        .populate('affiliateId', 'displayName email avatar')
        .sort({ createdAt: -1 });

    return { affiliates };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
