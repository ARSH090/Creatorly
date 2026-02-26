import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import SubscriberTag from '@/lib/models/SubscriberTag';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/tags
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tags = await SubscriberTag.distinct('tag', { creatorId: user._id });

        return NextResponse.json({ tags });
    } catch (error: any) {
        console.error('Error fetching unique tags:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
