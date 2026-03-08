import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { hasFeature } from '@/lib/utils/planLimits';

async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    if (!hasFeature(user, 'emailMarketing')) {
        return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || '-createdAt';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = { creatorId: user._id };

    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];
    }

    if (status) {
        query.status = status;
    }

    const total = await Subscriber.countDocuments(query);
    const subscribers = await Subscriber.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return NextResponse.json({
        subscribers,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
}

export const GET = withCreatorAuth(getHandler);
