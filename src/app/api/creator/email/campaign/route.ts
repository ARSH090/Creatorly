import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import EmailCampaign from '@/lib/models/EmailCampaign';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * POST /api/creator/email/campaign
 * Create email campaign
 * Body: { name, subject, content, listId?, scheduledAt? }
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // BUG-29 FIX: Use subscriptionTier (correct) first, fallback to plan (legacy)
    const effectiveTier = user.subscriptionTier || user.plan || 'free';
    if (!hasFeature(effectiveTier, 'emailMarketing')) {
        throw new Error('Email marketing requires Creator Pro plan');
    }

    const body = await req.json();
    const { name, subject, content, listId, scheduledAt } = body;

    if (!name || !subject || !content) {
        throw new Error('name, subject, and content are required');
    }

    let recipientsPool: string[] = [];

    if (listId && listId !== 'all') {
        const { EmailList } = await import('@/lib/models/EmailList');
        const list = await EmailList.findById(listId);
        if (list && list.subscribers) {
            recipientsPool = list.subscribers;
        }
    } else {
        const { Order } = await import('@/lib/models/Order');
        const orders = await Order.find({
            creatorId: user._id,
            paymentStatus: 'paid',
            customerEmail: { $exists: true, $ne: null }
        }).select('customerEmail').lean();

        // Get unique emails
        const emails = orders.map(o => o.customerEmail).filter(Boolean);
        recipientsPool = [...new Set(emails)] as string[];
    }

    const campaign = await EmailCampaign.create({
        creatorId: user._id,
        name,
        subject,
        content,
        listId: listId && listId !== 'all' ? listId : undefined,
        recipients: recipientsPool,
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
