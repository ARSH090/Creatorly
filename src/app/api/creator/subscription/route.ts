import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/subscription
 * Get current subscription details
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const creator = await User.findById(user._id).select(
        'plan planExpiresAt stripeCustomerId'
    );

    if (!creator) {
        throw new Error('Creator not found');
    }

    const { getPlanLimits, isPlanExpired } = await import('@/lib/utils/planLimits');
    const limits = getPlanLimits(creator.plan || 'free');
    const expired = isPlanExpired(creator.planExpiresAt);

    return {
        subscription: {
            plan: creator.plan || 'free',
            expiresAt: creator.planExpiresAt,
            isExpired: expired,
            stripeCustomerId: creator.stripeCustomerId,
            limits
        }
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
