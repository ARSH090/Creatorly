import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import EmailCampaign from '@/lib/models/EmailCampaign';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * GET /api/creator/email/campaigns
 * List all email campaigns
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'emailMarketing')) {
        throw new Error('Email marketing requires Creator Pro plan');
    }

    const campaigns = await EmailCampaign.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    return {
        campaigns: campaigns.map(campaign => ({
            _id: campaign._id,
            name: campaign.name,
            subject: campaign.subject,
            status: campaign.status,
            scheduledAt: campaign.scheduledAt,
            sentAt: campaign.sentAt,
            createdAt: campaign.createdAt,
            stats: campaign.stats || {
                sent: 0,
                opened: 0,
                clicked: 0
            }
        }))
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
