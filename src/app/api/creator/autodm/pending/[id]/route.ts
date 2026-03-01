import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { PendingFollower } from '@/lib/models/PendingFollower';
import { User } from '@/lib/models/User';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const deleted = await PendingFollower.findOneAndDelete({ _id: params.id, creatorId: user._id });
        if (!deleted) return new NextResponse('Not found', { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}
