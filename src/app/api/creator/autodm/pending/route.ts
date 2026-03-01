import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { PendingFollower } from '@/lib/models/PendingFollower';
import { User } from '@/lib/models/User';
import { decryptStringToken } from '@/lib/security/encryption';
import { sendInstagramDM } from '@/lib/services/autoDMService';
import { AutoDMRule } from '@/lib/models/AutoDMRule';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const pending = await PendingFollower.find({ creatorId: user._id, status: 'pending' })
            .sort({ triggeredAt: -1 });

        return NextResponse.json(pending);
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}

