import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmailList } from '@/lib/models/EmailList';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * GET /api/creator/email/lists
 * Get all email lists for the creator
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'emailMarketing')) {
        throw new Error('Email marketing requires Creator Pro plan');
    }

    const lists = await EmailList.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    return {
        lists: lists.map((list: any) => ({
            _id: list._id,
            name: list.name,
            description: list.description,
            subscriberCount: list.subscribers?.length || 0,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt
        }))
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
