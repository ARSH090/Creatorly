import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const GET = withAuth(async (req: NextRequest, user: any) => {
    try {
        const userId = user._id;
        const { searchParams } = new URL(req.url);
        const platform = searchParams.get('platform');

        await connectToDatabase();

        const query: any = { creatorId: userId };
        if (platform) query.platform = platform;

        const rules = await AutoReplyRule.find(query).sort({ priority: -1, createdAt: -1 });

        return NextResponse.json({ success: true, rules });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
    try {
        const userId = user._id;
        const data = await req.json();

        await connectToDatabase();

        // Check plan limits
        const ruleCount = await AutoReplyRule.countDocuments({ creatorId: userId });
        // Assume basic plan limit is 10 for now, pro is unlimited/higher
        // In real app, fetch from User.planLimits

        const rule = await AutoReplyRule.create({
            ...data,
            ruleId: uuidv4(),
            creatorId: userId,
            loopPreventionId: crypto.createHash('md5').update(data.replyText || '').digest('hex')
        });

        return NextResponse.json({ success: true, rule });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
