import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import EmailCampaign from '@/lib/models/EmailCampaign';
import Subscriber from '@/lib/models/Subscriber';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';
import { sendMarketingEmail } from '@/lib/services/email';
import { mailQueue as emailQueue } from '@/lib/queue';
import { getSubscribersForCampaign } from '@/lib/services/emailSegmentation';

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
    const { name, subject, content, targetAudience, targetProductId, targetTags, action, scheduledFor } = body;

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

    // Immediate send
    if (action === 'send') {
        const subscribers = await getSubscribersForCampaign(
            campaign.creatorId.toString(),
            campaign.targetAudience,
            targetProductId,
            targetTags
        );

        if (subscribers.length === 0) {
            await EmailCampaign.findByIdAndUpdate(campaign._id, { status: 'failed' });
            return NextResponse.json(
                { error: 'No active subscribers match this audience.' },
                { status: 400 }
            );
        }

        // Update status and recipient count immediately
        await EmailCampaign.findByIdAndUpdate(campaign._id, {
            status: 'sending',
            recipientCount: subscribers.length,
            queuedAt: new Date(),
        } as any);

        // Chunk into batches of 50 and enqueue
        const BATCH_SIZE = 50;
        const batches: typeof subscribers[] = [];
        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
            batches.push(subscribers.slice(i, i + BATCH_SIZE));
        }

        await emailQueue.addBulk(
            batches.map((batch, index) => ({
                name: 'creator-campaign-batch',
                data: {
                    campaignId: campaign._id.toString(),
                    recipientBatch: batch,
                    batchIndex: index,
                    totalBatches: batches.length,
                },
                opts: {
                    delay: index * 1500,   // 1.5s between batches → Resend rate-safe
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5_000 },
                    removeOnComplete: { count: 500 },
                    removeOnFail: { count: 100 },
                },
            }))
        );

        return NextResponse.json({
            success: true,
            campaignId: campaign._id,
            recipientCount: subscribers.length,
            batches: batches.length,
            message: `Queued ${subscribers.length} emails in ${batches.length} batches.`,
        });
    }

    return NextResponse.json({ campaign }, { status: 201 });
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(postHandler);

