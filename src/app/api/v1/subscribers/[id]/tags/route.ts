import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import SubscriberTag from '@/lib/models/SubscriberTag';
import Subscriber from '@/lib/models/Subscriber';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/subscribers/:id/tags
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tags = await SubscriberTag.find({
            subscriberId: params.id,
            creatorId: user._id
        }).sort({ createdAt: -1 });

        return NextResponse.json({ tags: tags.map(t => t.tag) });
    } catch (error: any) {
        console.error('Error fetching subscriber tags:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/subscribers/:id/tags
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { tags } = body; // Array of strings

        if (!tags || !Array.isArray(tags)) {
            return NextResponse.json({ error: 'Tags array required' }, { status: 400 });
        }

        const operations = tags.map(tag => ({
            updateOne: {
                filter: { subscriberId: params.id, tag: tag.trim() },
                update: {
                    $setOnInsert: {
                        creatorId: user._id,
                        subscriberId: params.id,
                        tag: tag.trim(),
                        source: 'manual'
                    }
                },
                upsert: true
            }
        }));

        await SubscriberTag.bulkWrite(operations);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error adding subscriber tags:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
