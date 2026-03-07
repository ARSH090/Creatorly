import { NextRequest, NextResponse } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import EmailList from '@/lib/models/EmailList';

async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');

    let count = 0;

    if (!listId || listId === 'all') {
        count = await Subscriber.countDocuments({
            creatorId: user._id,
            status: 'active'
        });
    } else {
        const list = await EmailList.findOne({ _id: listId, creatorId: user._id });
        if (list) {
            // Depending on how list is stored, either it has an array of emails or we query subscribers
            if (list.subscribers && Array.isArray(list.subscribers)) {
                count = list.subscribers.length;
            } else {
                // Future-proofing if we ever move to complex rules
                count = 0;
            }
        }
    }

    return NextResponse.json({ count });
}

export const GET = withCreatorAuth(withErrorHandler(handler));
