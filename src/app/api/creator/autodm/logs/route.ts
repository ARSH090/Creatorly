import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { AutoDMLog } from '@/lib/models/AutoDMLog';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const logs = await AutoDMLog.find({ creatorId: user._id })
            .sort({ createdAt: -1 })
            .limit(100);

        return NextResponse.json(logs);
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}

