import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { AutoDMRule } from '@/lib/models/AutoDMRule';
import { User } from '@/lib/models/User';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });
        const body = await req.json();

        const rule = await AutoDMRule.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: body },
            { new: true }
        );

        if (!rule) return new NextResponse('Rule not found', { status: 404 });
        return NextResponse.json(rule);
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const deleted = await AutoDMRule.findOneAndDelete({ _id: params.id, creatorId: user._id });
        if (!deleted) return new NextResponse('Rule not found', { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}
