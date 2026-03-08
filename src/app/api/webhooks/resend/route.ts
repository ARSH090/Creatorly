import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import EmailCampaign from '@/lib/models/EmailCampaign';
import EmailSequence from '@/lib/models/EmailSequence';
import Subscriber from '@/lib/models/Subscriber';

/**
 * POST /api/webhooks/resend
 * Handles Resend webhooks for email analytics
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Resend sends an array of events or a single event
        const events = Array.isArray(payload) ? payload : [payload];

        await connectToDatabase();

        for (const event of events) {
            const { type, data } = event;
            const email = data?.to?.[0] || data?.email;

            if (!email) continue;

            const tags = data?.tags || {};
            const campaignId = tags.campaignId || data?.headers?.['X-Campaign-Id'];
            const sequenceId = tags.sequenceId;

            if (campaignId) {
                await handleCampaignEvent(campaignId, type);
            }

            if (sequenceId) {
                await handleSequenceEvent(sequenceId, type);
            }

            if (type === 'email.bounced') {
                await Subscriber.updateMany(
                    { email: email.toLowerCase() },
                    { status: 'bounced', bouncedAt: new Date() }
                );
            } else if (type === 'email.complained') {
                await Subscriber.updateMany(
                    { email: email.toLowerCase() },
                    { status: 'unsubscribed', unsubscribedAt: new Date() }
                );
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('[Resend Webhook] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleCampaignEvent(campaignId: string, type: string) {
    const update: Record<string, any> = {};

    switch (type) {
        case 'email.sent': update['stats.sent'] = 1; break;
        case 'email.delivered': update['stats.delivered'] = 1; break;
        case 'email.opened': update['stats.opened'] = 1; break;
        case 'email.clicked': update['stats.clicked'] = 1; break;
        case 'email.bounced': update['stats.bounced'] = 1; break;
        case 'email.complained': update['stats.unsubscribed'] = 1; break;
    }

    if (Object.keys(update).length > 0) {
        await EmailCampaign.findByIdAndUpdate(campaignId, { $inc: update });
    }
}

async function handleSequenceEvent(sequenceId: string, type: string) {
    // Sequences might track overall opens/clicks in a different way or on steps
    // For now, let's assume overall sequence stats or add specific step tracking if needed.
    // Simplifying: we just increment enrollments/completed for now as seen in model.
}
