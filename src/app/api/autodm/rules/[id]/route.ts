import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';
import crypto from 'crypto';

export const GET = withAuth(async (req: NextRequest, user: any, { params }: any) => {
    try {
        const { id } = params;
        const userId = user._id;
        await connectToDatabase();

        const rule = await AutoReplyRule.findOne({ _id: id, creatorId: userId });
        if (!rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, rule });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const PUT = withAuth(async (req: NextRequest, user: any, { params }: any) => {
    try {
        const { id } = params;
        const userId = user._id;
        const data = await req.json();

        await connectToDatabase();

        if (data.replyText) {
            data.loopPreventionId = crypto.createHash('md5').update(data.replyText).digest('hex');
        }

        const rule = await AutoReplyRule.findOneAndUpdate(
            { _id: id, creatorId: userId },
            { $set: data },
            { new: true }
        );

        if (!rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, rule });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (req: NextRequest, user: any, { params }: any) => {
    try {
        const { id } = params;
        const userId = user._id;
        await connectToDatabase();

        const result = await AutoReplyRule.deleteOne({ _id: id, creatorId: userId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Rule deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
