import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import EmailCampaign from '@/lib/models/EmailCampaign';
import Subscriber from '@/lib/models/Subscriber';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';
import { sendMarketingEmail } from '@/lib/services/email';

/**
 * GET /api/creator/email/campaigns
 * List all email campaigns
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    if (!hasFeature(user, 'emailMarketing')) {
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

/**
 * POST /api/creator/email/campaigns
 * Create a new email campaign (draft, test, send, or schedule)
 */
async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    if (!hasFeature(user, 'emailMarketing')) {
        return NextResponse.json({ error: 'Upgrade required', code: 'PLAN_LIMIT' }, { status: 403 });
    }

    const body = await req.json();
    const { name, subject, content, targetAudience, action, scheduledFor } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Campaign name required' }, { status: 400 });
    if (!subject?.trim()) return NextResponse.json({ error: 'Subject required' }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: 'Email content required' }, { status: 400 });

    if (action === 'schedule' && scheduledFor) {
        if (new Date(scheduledFor) <= new Date()) {
            return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
        }
    }

    const campaign = await EmailCampaign.create({
        creatorId: user._id,
        name: name.trim(),
        subject: subject.trim(),
        content,
        targetAudience: targetAudience || 'all',
        status: action === 'send' ? 'queued' : action === 'schedule' ? 'scheduled' : 'draft',
        scheduledAt: action === 'schedule' ? new Date(scheduledFor) : undefined,
    });

    // Test send — send only to creator's own email
    if (action === 'test') {
        const personalizedSubject = subject.replace(/\{\{first_name\}\}/g, user.displayName || 'Creator');
        const personalizedBody = content.replace(/\{\{first_name\}\}/g, user.displayName || 'Creator');
        await sendMarketingEmail(user.email, {
            subject: `[TEST] ${personalizedSubject}`,
            html: personalizedBody,
        }).catch((err: any) => console.error('Test email failed:', err));
        await EmailCampaign.findByIdAndUpdate(campaign._id, { status: 'draft' });
        return NextResponse.json({ campaign, testSent: true }, { status: 201 });
    }

    // Immediate send — process subscribers in background
    if (action === 'send') {
        sendCampaignToSubscribers(campaign._id.toString(), user._id.toString(), {
            subject, content, targetAudience: targetAudience || 'all'
        }).catch((err: any) => console.error('[CAMPAIGN_SEND]', err));
    }

    return NextResponse.json({ campaign }, { status: 201 });
}

/**
 * Background: send campaign to all matching subscribers
 */
async function sendCampaignToSubscribers(
    campaignId: string,
    creatorId: string,
    opts: { subject: string; content: string; targetAudience: string }
) {
    const filter: Record<string, unknown> = { creatorId, status: 'active' };
    const subscribers = await Subscriber.find(filter).select('email name').lean();
    let sentCount = 0;
    let failCount = 0;

    for (const sub of subscribers) {
        const firstName = sub.name?.split(' ')[0] || 'there';
        const personalizedSubject = opts.subject.replace(/\{\{first_name\}\}/g, firstName);
        const personalizedBody = opts.content.replace(/\{\{first_name\}\}/g, firstName);

        try {
            await sendMarketingEmail(sub.email, {
                subject: personalizedSubject,
                html: personalizedBody,
            });
            sentCount++;
        } catch {
            failCount++;
        }

        // Throttle: 100ms between sends
        await new Promise(r => setTimeout(r, 100));
    }

    await EmailCampaign.findByIdAndUpdate(campaignId, {
        status: 'sent',
        sentAt: new Date(),
        'stats.sent': sentCount,
        'stats.delivered': sentCount - failCount,
    });
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(postHandler);

