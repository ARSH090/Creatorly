import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import { getCurrentUser } from '@/lib/auth/server-auth';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const subscriptions = await Subscription.find({
            userId: (user as any)._id,
            deletedAt: null
        }).populate('productId', 'name image price type')
            .sort({ createdAt: -1 });

        return NextResponse.json({ subscriptions });
    } catch (error: any) {
        console.error('Fetch Subscriptions Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
