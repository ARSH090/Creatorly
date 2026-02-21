import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(req: NextRequest, user: any) {
    return NextResponse.json({
        autoSendEnabled: user.autoSendEnabled ?? true,
        googleSheetsConnected: !!(user.googleSheetsToken || user.googleSheetsId),
        notificationPrefs: user.notificationPrefs || { email: true, whatsapp: false },
        storeSlug: user.storeSlug,
        username: user.username
    });
}

async function putHandler(req: NextRequest, user: any) {
    const body = await req.json();
    await connectToDatabase();

    const allowedUpdates: any = {};
    if (typeof body.autoSendEnabled === 'boolean') allowedUpdates.autoSendEnabled = body.autoSendEnabled;
    if (body.notificationPrefs) {
        allowedUpdates.notificationPrefs = {
            ...user.notificationPrefs,
            ...body.notificationPrefs
        };
    }
    if (body.storeSlug) allowedUpdates.storeSlug = body.storeSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: allowedUpdates },
        { new: true }
    );

    return NextResponse.json(updatedUser);
}

export const GET = withAuth(withErrorHandler(getHandler));
export const PUT = withAuth(withErrorHandler(putHandler));
