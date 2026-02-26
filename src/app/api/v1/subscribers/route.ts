import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import { getMongoUser } from '@/lib/auth/get-user';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const tag = searchParams.get('tag');
        const source = searchParams.get('source');
        const status = searchParams.get('status');
        const hasPurchased = searchParams.get('hasPurchased');

        const query: any = { creatorId: user._id };

        if (tag) query.tags = tag;
        if (source) query.source = source;
        if (status) query.status = status;

        if (hasPurchased === 'true') {
            query.tags = { $in: ['customer', 'purchased'] }; // Using standard internal tags
        } else if (hasPurchased === 'false') {
            query.tags = { $nin: ['customer', 'purchased'] };
        }

        const subscribers = await Subscriber.find(query)
            .sort({ createdAt: -1 })
            .limit(100) // Pagination could be added
            .lean();

        return NextResponse.json({ subscribers });

    } catch (error: any) {
        console.error('Subscribers Listing API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
