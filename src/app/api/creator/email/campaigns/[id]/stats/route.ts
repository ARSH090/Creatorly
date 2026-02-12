import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmailCampaign } from '@/lib/models/EmailCampaign';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/email/campaigns/:id/stats
 * Get campaign statistics
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const campaignId = params.id;

    const campaign = await EmailCampaign.findOne({
        _id: campaignId,
        creatorId: user._id
    });

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    const stats = campaign.stats || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
    };

    // Calculate rates
    const openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
    const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
    const bounceRate = stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0;

    return {
        campaign: {
            id: campaign._id,
            name: campaign.name,
            subject: campaign.subject,
            status: campaign.status,
            sentAt: campaign.sentAt,
            createdAt: campaign.createdAt
        },
        stats: {
            ...stats,
            openRate: Math.round(openRate * 100) / 100,
            clickRate: Math.round(clickRate * 100) / 100,
            bounceRate: Math.round(bounceRate * 100) / 100
        }
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
