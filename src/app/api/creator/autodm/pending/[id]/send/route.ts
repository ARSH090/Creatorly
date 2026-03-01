import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { PendingFollower } from '@/lib/models/PendingFollower';
import { User } from '@/lib/models/User';
import { decryptStringToken } from '@/lib/security/encryption';
import { sendInstagramDM } from '@/lib/services/autoDMService';
import { AutoDMRule } from '@/lib/models/AutoDMRule';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id instagramConnection');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const pf = await PendingFollower.findOne({ _id: params.id, creatorId: user._id, status: 'pending' });
        if (!pf) return new NextResponse('Not found or no longer pending', { status: 404 });

        const accessToken = decryptStringToken(user.instagramConnection?.accessToken!);

        const sent = await sendInstagramDM(
            accessToken,
            pf.instagramUserId,
            pf.pendingMessage
        );

        await PendingFollower.findByIdAndUpdate(pf._id, {
            status: sent ? 'dm_sent' : 'pending',
            dmSentAt: sent ? new Date() : undefined
        });

        if (sent) {
            await AutoDMRule.findByIdAndUpdate(pf.ruleId, {
                $inc: { totalDMsSent: 1 }
            });
        }

        return NextResponse.json({ success: sent });
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}
