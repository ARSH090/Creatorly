import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmailCampaign } from '@/lib/models/EmailCampaign';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';
import { QueueJob } from '@/lib/models/QueueJob';

/**
 * POST /api/creator/email/send
 * Queues an email broadcast campaign
 * 
 * FIXES:
 * - BUG-27: Email send now uses a background queue (no more synchronous send that times out)
 * - BUG-28: Unsubscribe URL is injected into every email via campaign metadata
 * - BUG-29: Plan check now uses subscriptionTier first, falls back to plan (legacy)
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // BUG-29 FIX: Use subscriptionTier (correct field), fallback to plan (legacy)
    const effectiveTier = user.subscriptionTier || user.plan || 'free';
    if (!hasFeature(effectiveTier, 'emailMarketing')) {
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

    if (campaign.status === 'sent' || campaign.status === 'queued') {
        throw new Error(`Campaign already ${campaign.status}`);
    }

    if (!campaign.subject || !campaign.content) {
        throw new Error('Campaign is missing subject or content');
    }

    // BUG-28 CHECK: Warn if unsubscribe token not present in content
    if (!campaign.content.includes('{{unsubscribe}}') && !campaign.content.includes('/unsubscribe')) {
        console.warn(`[Email Campaign] Campaign ${campaignId} does not contain unsubscribe link — adding footer`);
    }

    // BUG-27 FIX: Queue the email send as a background job instead of blocking the request
    // This prevents the 60s Vercel timeout from killing a large broadcast mid-send
    await QueueJob.create({
        type: 'email_broadcast',
        payload: {
            campaignId: campaign._id.toString(),
            creatorId: user._id.toString(),
            // BUG-28 FIX: Include unsubscribe base URL so queue worker can inject per-recipient URLs
            unsubscribeBaseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
        },
        status: 'pending',
        nextRunAt: new Date()
    });

    // Mark as queued immediately so UI can show progress
    campaign.status = 'queued';
    await campaign.save();

    return {
        success: true,
        campaignId: campaign._id,
        message: 'Campaign queued for sending. You will receive a confirmation when complete.'
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
