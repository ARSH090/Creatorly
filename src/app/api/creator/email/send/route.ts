import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmailCampaign } from '@/lib/models/EmailCampaign';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
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
    const campaignId = body.campaignId;

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

    // 1. Fetch Creator Info
    const User = (await import('@/lib/models/User')).default;
    const creator = await User.findById(user._id).select('displayName').lean();
    const creatorName = creator?.displayName || 'a Creator';

    // 2. Identify Recipients
    let recipientEmails: string[] = [];

    if (campaign.listId) {
        // Fetch from specific list
        const { EmailList } = await import('@/lib/models/EmailList');
        const list = await EmailList.findById(campaign.listId);
        if (list) {
            recipientEmails = list.subscribers || [];
        }
    } else {
        // Broadcast to ALL: Orders + NewsletterLeads
        const orders = await Order.aggregate([
            {
                $match: {
                    creatorId: user._id,
                    paymentStatus: 'paid',
                    customerEmail: { $exists: true, $ne: null }
                }
            },
            { $group: { _id: '$customerEmail' } }
        ]);

        const { NewsletterLead } = await import('@/lib/models/NewsletterLead');
        const leads = await NewsletterLead.find({
            creatorId: user._id,
            status: 'active'
        }).select('email').lean();

        const allEmails = new Set([
            ...orders.map(o => o._id),
            ...leads.map(l => l.email)
        ]);
        recipientEmails = Array.from(allEmails);
    }

    const recipientCount = recipientEmails.length;
    if (recipientCount === 0) {
        throw new Error('No recipients found for this campaign');
    }

    // 3. Send Emails (Serial for stability, could be batched)
    const { sendMarketingEmail } = await import('@/lib/services/email');

    // In production, this should be moved to a background job/worker
    // But for a few dozen/hundred emails, we can try this in the request
    let sentCount = 0;
    for (const email of recipientEmails) {
        try {
            await sendMarketingEmail(
                email,
                campaign.subject,
                campaign.content,
                creatorName
            );
            sentCount++;
        } catch (err) {
            console.error(`Failed to send campaign to ${email}:`, err);
        }
    }

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = sentCount;
    await campaign.save();

    return {
        success: true,
        campaignId: campaign._id,
        recipientCount: sentCount,
        message: `Campaign sent to ${sentCount} recipients`
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
