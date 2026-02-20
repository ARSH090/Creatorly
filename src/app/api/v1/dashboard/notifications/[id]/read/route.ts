
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Notification from '@/lib/models/Notification';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// PUT /api/v1/dashboard/notifications/[id]/read
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: user._id },
            { $set: { read: true, readAt: new Date() } },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, notification });

    } catch (error: any) {
        console.error('Error reading notification:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
