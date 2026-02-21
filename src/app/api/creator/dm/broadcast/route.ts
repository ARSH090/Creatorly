import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { QueueJob } from '@/lib/models/QueueJob';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { decryptTokenGCM } from '@/lib/security/encryption';

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { recipients, message, platform, ruleId, delaySeconds = 5 } = body;

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

        // Batch Create Jobs with staggered execution times to avoid burst rate limits
        const jobs = recipients.map((recipient, index) => ({
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
            nextRunAt: new Date(Date.now() + index * delaySeconds * 1000)
        }));

        await QueueJob.insertMany(jobs);

        return NextResponse.json({
            success: true,
            message: `Enqueued ${jobs.length} broadcast messages`,
            totalEnqueued: jobs.length
        });

    } catch (error: any) {
        console.error('[Broadcast API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
