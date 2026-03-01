import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { PendingFollower } from '@/lib/models/PendingFollower';
import { AutoDMRule } from '@/lib/models/AutoDMRule';
import { decryptStringToken } from '@/lib/security/encryption';
import { checkIsFollower, sendInstagramDM } from '@/lib/services/autoDMService';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await dbConnect();

        // Get pending followers not yet expired
        const pending = await PendingFollower.find({
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
            .sort({ triggeredAt: 1 })
            .limit(100)
            .populate<{ creatorId: any }>('creatorId', 'instagramConnection'); // Populating only specific field

        let dmsSent = 0;
        let expired = 0;

        for (const pf of pending) {
            const creator = pf.creatorId;
            if (!creator?.instagramConnection?.accessToken) continue;

            const accessToken = decryptStringToken(creator.instagramConnection.accessToken);
            const creatorIgId = creator.instagramConnection.instagramUserId;

            const isNowFollowing = await checkIsFollower(
                accessToken,
                creatorIgId,
                pf.instagramUserId
            );

            if (isNowFollowing) {
                const sent = await sendInstagramDM(
                    accessToken,
                    pf.instagramUserId,
                    pf.pendingMessage
                );

                await PendingFollower.findByIdAndUpdate(pf._id, {
                    status: sent ? 'dm_sent' : 'pending',
                    followedAt: new Date(),
                    ...(sent ? { dmSentAt: new Date() } : {})
                });

                if (sent) {
                    dmsSent++;
                    await AutoDMRule.findByIdAndUpdate(pf.ruleId, {
                        $inc: { totalDMsSent: 1, totalFollowGateConverted: 1 }
                    });

                    // Real-time notification (mocked Push)
                    console.log(`Pusher -> autodm_follow_converted ${pf.instagramUsername}`);
                }
            } else {
                await PendingFollower.findByIdAndUpdate(pf._id, {
                    $inc: { checkCount: 1 },
                    lastCheckedAt: new Date()
                });
            }
        }

        // Expire old pending
        const expireResult = await PendingFollower.updateMany(
            { status: 'pending', expiresAt: { $lte: new Date() } },
            { status: 'expired' }
        );
        expired = expireResult.modifiedCount;

        return NextResponse.json({ processed: pending.length, dmsSent, expired });
    } catch (err: any) {
        console.error('Check followers cron GET Error:', err);
        return new NextResponse('Internal server error', { status: 500 });
    }
}

