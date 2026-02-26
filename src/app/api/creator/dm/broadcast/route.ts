import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { QueueJob } from '@/lib/models/QueueJob';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { decryptTokenGCM } from '@/lib/security/encryption';

/**
 * POST /api/creator/dm/broadcast
 * 
 * FIXES:
 * - BUG-19: Caps at 200 recipients/batch (Instagram rate limit) with minimum 18s gap between DMs
 */

// BUG-19 FIX: Instagram allows max 200 DMs/hour, so minimum gap is 18 seconds per message
const MAX_PER_BATCH = 200;
const MIN_DELAY_SECONDS = 18;

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { recipients, message, platform, ruleId, delaySeconds = MIN_DELAY_SECONDS } = body;

        if (!recipients || !Array.isArray(recipients) || !message) {
            return NextResponse.json({ error: 'Missing recipients or message' }, { status: 400 });
        }

        await connectToDatabase();

        let accessToken = '';
        if (platform !== 'whatsapp') {
            const account = await SocialAccount.findOne({ userId, platform: 'instagram', isActive: true });
            if (!account) return NextResponse.json({ error: 'Instagram account not connected' }, { status: 400 });

            accessToken = decryptTokenGCM(
                account.pageAccessToken,
                account.tokenIV,
                account.tokenTag
            );
        }

        // BUG-19 FIX: Enforce Instagram 200 DMs/hr rate limit
        const effectiveDelay = Math.max(delaySeconds, MIN_DELAY_SECONDS);
        const cappedRecipients = recipients.slice(0, MAX_PER_BATCH);
        const skippedCount = recipients.length - cappedRecipients.length;

        const jobs = cappedRecipients.map((recipient: any, index: number) => ({
            type: 'dm_delivery',
            payload: {
                recipientId: recipient.id,
                text: message,
                accessToken,
                creatorId: userId,
                ruleId,
                source: 'broadcast',
                platform: platform || 'instagram'
            },
            status: 'pending',
            nextRunAt: new Date(Date.now() + index * effectiveDelay * 1000)
        }));

        await QueueJob.insertMany(jobs);

        return NextResponse.json({
            success: true,
            message: `Enqueued ${jobs.length} broadcast messages`,
            totalEnqueued: jobs.length,
            ...(skippedCount > 0 && {
                warning: `${skippedCount} recipients skipped. Split into batches of ${MAX_PER_BATCH} to comply with Instagram rate limits.`
            })
        });

    } catch (error: any) {
        console.error('[Broadcast API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
