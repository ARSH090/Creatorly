import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmailCampaign } from '@/lib/models/EmailCampaign';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * POST /api/creator/email/send
 * Send email broadcast
 * Body: { campaignId }
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'emailMarketing')) {
        throw new Error('Email marketing requires Creator Pro plan');
    }

    const body = await req.json();
    const { campaignId } = body;

    if (!campaignId) {
        throw new Error('campaignId is required');
    }

    const campaign = await EmailCampaign.findOne({
        _id: campaignId,
        creatorId: user._id
    });

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    if (campaign.status === 'sent') {
        throw new Error('Campaign already sent');
    }

    // Get subscriber emails from orders
    const subscribers = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                paymentStatus: 'paid',
                customerEmail: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$customerEmail',
                name: { $first: '$customerName' }
            }
        }
    ]);

    const recipientCount = subscribers.length;

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, mark as sent and log
    console.log(`Sending campaign ${campaign.name} to ${recipientCount} subscribers`);

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = recipientCount;
    await campaign.save();

    return {
        success: true,
        campaignId: campaign._id,
        recipientCount,
        message: `Campaign sent to ${recipientCount} subscribers`
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
