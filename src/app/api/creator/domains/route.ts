import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CustomDomain } from '@/lib/models/CustomDomain';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * GET /api/creator/domains
 * List custom domains
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'customDomain')) {
        throw new Error('Custom domain requires Creator Pro plan');
    }

    const domains = await CustomDomain.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    return { domains };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
