import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { AutoDMRule } from '@/lib/models/AutoDMRule';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const rules = await AutoDMRule.find({ creatorId: user._id }).sort({ createdAt: -1 });
        return NextResponse.json(rules);
    } catch (err) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const body = await req.json();
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const newRule = await AutoDMRule.create({
            ...body,
            creatorId: user._id
        });

        return NextResponse.json(newRule, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

