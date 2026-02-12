import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmailCampaign } from '@/lib/models/EmailCampaign';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * POST /api/creator/email/campaign
 * Create email campaign
 * Body: { name, subject, content, listId?, scheduledAt? }
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'emailMarketing')) {
        throw new Error('Email marketing requires Creator Pro plan');
    }

    const body = await req.json();
    const { name, subject, content, listId, scheduledAt } = body;

    if (!name || !subject || !content) {
        throw new Error('name, subject, and content are required');
    }

    const campaign = await EmailCampaign.create({
        creatorId: user._id,
        name,
        subject,
        content,
        listId,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        stats: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0
        }
    });

    return {
        success: true,
        campaign,
        message: 'Campaign created successfully'
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
