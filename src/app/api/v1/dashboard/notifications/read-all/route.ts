
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Notification from '@/lib/models/Notification';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const result = await Notification.updateMany(
            { userId: user._id, read: false },
            { $set: { read: true, readAt: new Date() } }
        );

        return NextResponse.json({ success: true, marked_count: result.modifiedCount });

    } catch (error: any) {
        console.error('Error reading all notifications:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
